import { currencySymbolMap } from '../../utils/currency.js';
import { fetchHybrisProduct, getHybrisProductCode, scheduleHybrisTask } from '../../scripts/hybris-bff.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_TAGS_ENDPOINT = '/content/cq:tags/hisense.-1.json';
const PLP_PRODUCTS_READY_EVENT = 'hisense:plp-products-ready';
const PRICE_FILTER_STATE_KEY = '__hisensePlpPriceFilterState';
const PRODUCT_PRICE_CACHE_KEY = '__hisensePlpProductPriceCache';
const PRODUCT_PRICE_PROMISE_CACHE_KEY = '__hisensePlpProductPricePromiseCache';
const PRICE_DATASET_SIGNATURE_KEY = '__hisensePlpPriceDatasetSignature';
const PRICE_REQUEST_CONCURRENCY = 6;
let CURRENCY_SYMBOL = '$';
const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

function ensurePriceFilterState() {
  const currentState = window[PRICE_FILTER_STATE_KEY] || {};
  const nextState = {
    min: Number.isFinite(currentState.min) ? currentState.min : 0,
    max: Number.isFinite(currentState.max) ? currentState.max : 0,
    selectedMin: Number.isFinite(currentState.selectedMin) ? currentState.selectedMin : 0,
    selectedMax: Number.isFinite(currentState.selectedMax) ? currentState.selectedMax : 0,
    ready: currentState.ready === true,
    currencySymbol: currentState?.currencySymbol ?? CURRENCY_SYMBOL,
  };
  window[PRICE_FILTER_STATE_KEY] = nextState;
  return nextState;
}

function getProductPriceCache() {
  if (!window[PRODUCT_PRICE_CACHE_KEY]) {
    window[PRODUCT_PRICE_CACHE_KEY] = {};
  }
  return window[PRODUCT_PRICE_CACHE_KEY];
}

function getProductPricePromiseCache() {
  if (!window[PRODUCT_PRICE_PROMISE_CACHE_KEY]) {
    window[PRODUCT_PRICE_PROMISE_CACHE_KEY] = {};
  }
  return window[PRODUCT_PRICE_PROMISE_CACHE_KEY];
}

function getPriceDatasetSignature(items = []) {
  return [...new Set(
    items
      .map((item) => getHybrisProductCode(item))
      .filter(Boolean),
  )]
    .sort()
    .join('|');
}

function clampPriceValue(value, minPrice, maxPrice) {
  if (!Number.isFinite(value)) {
    return minPrice;
  }
  return Math.min(maxPrice, Math.max(minPrice, value));
}

function syncPriceFilterState(partialState = {}) {
  const state = ensurePriceFilterState();
  Object.assign(state, partialState);

  state.min = Number.isFinite(state.min) ? state.min : 0;
  state.max = Number.isFinite(state.max) ? state.max : state.min;
  if (state.max < state.min) {
    state.max = state.min;
  }

  state.selectedMin = clampPriceValue(state.selectedMin, state.min, state.max);
  state.selectedMax = clampPriceValue(state.selectedMax, state.min, state.max);

  if (state.selectedMin > state.selectedMax) {
    if (document.activeElement && document.activeElement.id === 'max-input') {
      state.selectedMin = state.selectedMax;
    } else {
      state.selectedMax = state.selectedMin;
    }
  }
  window[PRICE_FILTER_STATE_KEY] = state;
  return state;
}

window.getPlpPriceFilterState = function getPlpPriceFilterState() {
  return ensurePriceFilterState();
};

function formatCurrency(num) {
  const safeValue = Number.isFinite(Number(num)) ? Math.trunc(Number(num)) : 0;
  return `${CURRENCY_SYMBOL} ${safeValue.toLocaleString()}`;
}

function parseNumericPriceValue(price) {
  if (price === null || price === undefined || price === '') {
    return null;
  }

  if (typeof price === 'number') {
    return Number.isFinite(price) ? price : null;
  }

  if (typeof price === 'string') {
    const normalized = Number(price.replace(/[^\d.-]/g, ''));
    return Number.isFinite(normalized) ? normalized : null;
  }

  if (typeof price === 'object') {
    return parseNumericPriceValue(
      price.value
      ?? price.formattedValue
      ?? price.sale
      ?? price.price
      ?? price.current
      ?? price.specialprice
      ?? price.regularprice,
    );
  }

  return null;
}

function resolveProductPriceValue(product, fallbackItem = null) {
  const candidates = [
    product?.pricing?.sale,
    product?.pricing?.price,
    product?.pricing?.current,
    product?.price,
    product?.pricing?.msrp,
    product?.msrp,
    fallbackItem?.priceInfo?.specialprice,
    fallbackItem?.priceInfo?.regularprice,
    fallbackItem?.priceInfo_specialprice,
    fallbackItem?.priceInfo_regularPrice,
    fallbackItem?.price,
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    const value = parseNumericPriceValue(candidates[i]);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getResolvedItemPrice(item) {
  const cache = getProductPriceCache();
  const code = getHybrisProductCode(item);
  const hasCachedPrice = Boolean(code)
    && Object.prototype.hasOwnProperty.call(cache, code);

  if (hasCachedPrice) {
    const cachedPrice = cache[code];
    return {
      value: Number.isFinite(cachedPrice) ? cachedPrice : 0,
      missing: !Number.isFinite(cachedPrice),
    };
  }

  const fallbackPrice = resolveProductPriceValue(null, item);
  return {
    value: Number.isFinite(fallbackPrice) ? fallbackPrice : 0,
    missing: !Number.isFinite(fallbackPrice),
  };
}

window.getPlpItemResolvedPrice = function getPlpItemResolvedPrice(item) {
  return getResolvedItemPrice(item).value;
};

function getPriceBounds(items = []) {
  const priceDetails = items.map((item) => getResolvedItemPrice(item));
  const numericPrices = priceDetails.filter((detail) => !detail.missing).map((detail) => detail.value);
  const hasMissingPrice = priceDetails.some((detail) => detail.missing);
  let minPrice = 0;
  if (!hasMissingPrice && numericPrices.length) {
    minPrice = Math.floor(Math.min(...numericPrices));
  }
  const maxPrice = numericPrices.length ? Math.ceil(Math.max(...numericPrices)) : 0;

  return {
    minPrice,
    maxPrice: Math.max(maxPrice, minPrice),
  };
}

async function runConcurrentTasks(items, task, concurrency = PRICE_REQUEST_CONCURRENCY) {
  const queue = Array.isArray(items) ? items.slice() : [];
  const runWorker = async () => {
    const currentItem = queue.shift();
    if (!currentItem) {
      return;
    }

    await task(currentItem);
    await runWorker();
  };
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => runWorker());

  await Promise.all(workers);
}

async function loadHybrisPrices(items = []) {
  const itemsByCode = new Map();
  items.forEach((item) => {
    const code = getHybrisProductCode(item);
    if (code && !itemsByCode.has(code)) {
      itemsByCode.set(code, item);
    }
  });

  const cache = getProductPriceCache();
  const promiseCache = getProductPricePromiseCache();
  const codes = [...itemsByCode.keys()];
  await runConcurrentTasks(codes, async (code) => {
    if (Object.prototype.hasOwnProperty.call(cache, code)) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(promiseCache, code)) {
      await promiseCache[code];
      return;
    }

    const fallbackItem = itemsByCode.get(code);
    promiseCache[code] = (async () => {
      try {
        const product = await fetchHybrisProduct(code);
        if (product?.price?.currencyIso) {
          CURRENCY_SYMBOL = currencySymbolMap.get(product.price.currencyIso)?.uiSymbol || CURRENCY_SYMBOL;
        }
        const resolvedPrice = resolveProductPriceValue(product, fallbackItem);
        cache[code] = Number.isFinite(resolvedPrice) ? resolvedPrice : null;
      } catch (error) {
        cache[code] = null;
      } finally {
        delete promiseCache[code];
      }
    })();

    await promiseCache[code];
  });
}

// 构建price slider item.
const generatePriceSlider = (rowEl) => {
  const priceSliderWrapper = document.createElement('div');
  priceSliderWrapper.className = 'price-slider-wrapper';
  // eslint-disable-next-line no-unused-vars
  const [titleEl, minLabelEl, maxLabelEl] = [...rowEl.children];
  const minLabel = minLabelEl?.querySelector('p')?.textContent ?? '';
  const maxLabel = maxLabelEl?.querySelector('p')?.textContent ?? '';
  const initialState = syncPriceFilterState({
    min: 0,
    max: 0,
    selectedMin: 0,
    selectedMax: 0,
    ready: false,
    currencySymbol: CURRENCY_SYMBOL,
  });
  const minPrice = initialState.min;
  const maxPrice = initialState.max;
  const minPriceSymbol = formatCurrency(minPrice, CURRENCY_SYMBOL);
  const maxPriceSymbol = formatCurrency(maxPrice, CURRENCY_SYMBOL);

  // 顶部price tags
  const priceTagsEl = document.createElement('div');
  priceTagsEl.className = 'price-tags';
  const minPriceTagEl = document.createElement('div');
  minPriceTagEl.setAttribute('id', 'min-price-label');
  minPriceTagEl.textContent = minPriceSymbol;
  minPriceTagEl.className = 'price-tag min-price-tag';
  const maxPriceTagEl = document.createElement('div');
  maxPriceTagEl.setAttribute('id', 'max-price-label');
  maxPriceTagEl.textContent = maxPriceSymbol;
  maxPriceTagEl.className = 'price-tag max-price-tag';
  priceTagsEl.appendChild(minPriceTagEl);
  priceTagsEl.appendChild(maxPriceTagEl);
  priceSliderWrapper.appendChild(priceTagsEl);

  // 中间滑动区域
  const sliderTrackEl = document.createElement('div');
  sliderTrackEl.className = 'slider-track';
  const sliderFillEl = document.createElement('div');
  sliderFillEl.setAttribute('id', 'slider-fill');
  sliderFillEl.className = 'slider-fill';
  const minInputEl = document.createElement('input');
  Object.assign(minInputEl, {
    id: 'min-input',
    type: 'range',
    min: minPrice,
    max: maxPrice,
    step: 1,
  });
  minInputEl.value = minPrice;
  const maxInputEl = document.createElement('input');
  Object.assign(maxInputEl, {
    id: 'max-input',
    type: 'range',
    min: minPrice,
    max: maxPrice,
    step: 1,
  });
  maxInputEl.value = maxPrice;
  sliderTrackEl.appendChild(sliderFillEl);
  sliderTrackEl.appendChild(minInputEl);
  sliderTrackEl.appendChild(maxInputEl);
  priceSliderWrapper.appendChild(sliderTrackEl);

  // 底部文案
  const limitsEl = document.createElement('div');
  limitsEl.className = 'limits';
  const minPriceWrapperEl = document.createElement('div');
  const minPriceLabelEl = document.createElement('div');
  minPriceLabelEl.textContent = minLabel;
  minPriceLabelEl.className = 'label';
  const minPriceValueEl = document.createElement('div');
  minPriceValueEl.classList = 'value';
  minPriceValueEl.textContent = minPriceSymbol;
  minPriceWrapperEl.appendChild(minPriceLabelEl);
  minPriceWrapperEl.appendChild(minPriceValueEl);

  const maxPriceWrapperEl = document.createElement('div');
  const maxPriceLabelEl = document.createElement('div');
  maxPriceLabelEl.textContent = maxLabel;
  maxPriceLabelEl.className = 'label';
  const maxPriceValueEl = document.createElement('div');
  maxPriceValueEl.classList = 'value';
  maxPriceValueEl.textContent = maxPriceSymbol;
  maxPriceWrapperEl.appendChild(maxPriceLabelEl);
  maxPriceWrapperEl.appendChild(maxPriceValueEl);

  limitsEl.appendChild(minPriceWrapperEl);
  limitsEl.appendChild(maxPriceWrapperEl);
  priceSliderWrapper.appendChild(limitsEl);

  const updateSlider = (shouldApplyFilter = false) => {
    const nextState = syncPriceFilterState({
      selectedMin: parseInt(minInputEl.value, 10),
      selectedMax: parseInt(maxInputEl.value, 10),
    });

    minInputEl.value = nextState.selectedMin;
    maxInputEl.value = nextState.selectedMax;

    const rangeDiff = Math.max(nextState.max - nextState.min, 1);
    const minPercent = ((nextState.selectedMin - nextState.min) / rangeDiff) * 100;
    const maxPercent = ((nextState.selectedMax - nextState.min) / rangeDiff) * 100;

    sliderFillEl.style.left = `${minPercent}%`;
    sliderFillEl.style.width = `${(maxPercent - minPercent)}%`;

    minPriceTagEl.style.left = `${minPercent}%`;
    minPriceTagEl.textContent = formatCurrency(nextState.selectedMin, nextState.currencySymbol);
    maxPriceTagEl.style.left = `${maxPercent}%`;
    maxPriceTagEl.textContent = formatCurrency(nextState.selectedMax, nextState.currencySymbol);

    minPriceValueEl.textContent = formatCurrency(nextState.min, nextState.currencySymbol);
    maxPriceValueEl.textContent = formatCurrency(nextState.max, nextState.currencySymbol);
    if (shouldApplyFilter && typeof window.applyPlpFilters === 'function') {
      window.applyPlpFilters();
    }
  };

  const updateRange = (nextMinPrice, nextMaxPrice) => {
    const nextState = syncPriceFilterState({
      min: nextMinPrice,
      max: nextMaxPrice,
      selectedMin: ensurePriceFilterState().ready ? ensurePriceFilterState().selectedMin : nextMinPrice,
      selectedMax: ensurePriceFilterState().ready ? ensurePriceFilterState().selectedMax : nextMaxPrice,
      ready: true,
      currencySymbol: ensurePriceFilterState().ready ? ensurePriceFilterState().currencySymbol : CURRENCY_SYMBOL,
    });

    minInputEl.min = nextState.min;
    minInputEl.max = nextState.max;
    maxInputEl.min = nextState.min;
    maxInputEl.max = nextState.max;
    minInputEl.value = nextState.selectedMin;
    maxInputEl.value = nextState.selectedMax;
    updateSlider(false);
  };

  const commitSliderFilter = () => updateSlider(true);

  minInputEl.addEventListener('input', () => updateSlider(false));
  maxInputEl.addEventListener('input', () => updateSlider(false));
  minInputEl.addEventListener('change', commitSliderFilter);
  maxInputEl.addEventListener('change', commitSliderFilter);
  updateSlider(false);

  return {
    element: priceSliderWrapper,
    updateRange,
  };
};

/**
 * Get tags endpoint URL with GraphQL base URL
 */
function getTagsEndpointUrl(customPath) {
  const baseUrl = window.GRAPHQL_BASE_URL || '';
  const path = customPath || DEFAULT_TAGS_ENDPOINT;
  return baseUrl ? `${baseUrl}${path}` : path;
}

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');

  const rows = [...block.children];
  const fragment = document.createDocumentFragment();
  let tagCounter = 0;
  let priceSliderController = null;
  let priceLoadVersion = 0;

  const refreshPriceSlider = (items = []) => {
    if (!priceSliderController || !Array.isArray(items) || !items.length) {
      return;
    }

    const datasetSignature = getPriceDatasetSignature(items);
    if (datasetSignature && window[PRICE_DATASET_SIGNATURE_KEY] === datasetSignature) {
      const { minPrice, maxPrice } = getPriceBounds(items);
      priceSliderController.updateRange(minPrice, maxPrice);
      if (typeof window.applyPlpFilters === 'function') {
        window.applyPlpFilters();
      }
      return;
    }

    const requestVersion = priceLoadVersion + 1;
    priceLoadVersion = requestVersion;
    scheduleHybrisTask(async () => {
      await loadHybrisPrices(items);
      if (requestVersion !== priceLoadVersion || !priceSliderController) {
        return;
      }

      window[PRICE_DATASET_SIGNATURE_KEY] = datasetSignature;
      const { minPrice, maxPrice } = getPriceBounds(items);
      priceSliderController.updateRange(minPrice, maxPrice);

      if (typeof window.applyPlpFilters === 'function') {
        window.applyPlpFilters();
      }
    }).catch((error) => {
      /* eslint-disable-next-line no-console */
      console.warn('Failed to refresh PLP price slider', error);
    });
  };

  document.addEventListener(PLP_PRODUCTS_READY_EVENT, (event) => {
    const items = Array.isArray(event.detail?.items) ? event.detail.items : (window.productData || []);
    refreshPriceSlider(items);
  });

  // 从 block 配置中读取 tagsEndpoint，如果没有配置则使用默认值
  const tagsEndpointRow = rows.find((row) => {
    const text = row.textContent && row.textContent.trim();
    return text && text.includes(',') && text.split(',').map((s) => s.trim()).includes('tagsEndpoint');
  });
  const tagsEndpointPath = tagsEndpointRow ? rows[tagsEndpointRow + 1]?.textContent?.trim() || DEFAULT_TAGS_ENDPOINT
    : DEFAULT_TAGS_ENDPOINT;

  const mockTags = {
    total: 1,
    offset: 0,
    limit: 1,
    columns: [
      'jcr:description',
      'jcr:title',
      'tv',
    ],
    data: [
      {
        'jcr:description': '',
        'jcr:title': 'Product',
        tv: {
          'jcr:title': 'TV',
          'jcr:description': '',
          resolution: {
            'jcr:title': 'Resolution',
            hd: {
              'jcr:description': '',
              'jcr:title': 'HD',
            },
            fhd: {
              'jcr:description': '',
              'jcr:title': 'FHD',
            },
            uhd: {
              'jcr:description': '',
              'jcr:title': 'UHD',
            },
          },
          'refresh-rate': {
            'jcr:description': '',
            'jcr:title': 'Refresh Rate',
            '60hz': {
              'jcr:description': '',
              'jcr:title': '60Hz',
            },
            '144hz': {
              'jcr:description': '',
              'jcr:title': '144Hz',
            },
            '165hz': {
              'jcr:description': '',
              'jcr:title': '165Hz',
            },
            '170hz': {
              'jcr:description': '',
              'jcr:title': '170Hz',
            },
            '180hz': {
              'jcr:description': '',
              'jcr:title': '180Hz',
            },
          },
          'screen-size': {
            'jcr:title': 'Screen Size (Range)',
            '32-43': {
              'jcr:description': '',
              'jcr:title': '32" - 43"',
            },
            '50-65': {
              'jcr:description': '',
              'jcr:title': '50" - 65"',
            },
            '70-85': {
              'jcr:description': '',
              'jcr:title': '70" - 85"',
            },
            '98-max': {
              'jcr:description': '',
              'jcr:title': '98" and above',
            },
          },
          type: {
            'jcr:description': '',
            'jcr:title': 'Type',
            'rgb-miniled': {
              'jcr:description': '',
              'jcr:title': 'RGB MiniLED',
            },
            miniled: {
              'jcr:description': '',
              'jcr:title': 'MiniLED',
            },
            'hi-qled': {
              'jcr:description': '',
              'jcr:title': 'Hi-QLED',
            },
            oled: {
              'jcr:description': '',
              'jcr:title': 'OLED',
            },
            'lcd-led': {
              'jcr:description': 'LCD LED\r\nFull Array',
              'jcr:title': 'LCD LED',
            },
            'uhd-4k': {
              'jcr:title': 'UHD 4K',
              'jcr:description': 'UHD 4K',
            },
          },
          'operating-system': {
            'jcr:title': 'Operating System',
            'fire-tv': {
              'jcr:description': '',
              'jcr:title': 'Fire TV',
            },
            'google-tv': {
              'jcr:description': '',
              'jcr:title': 'Google TV',
            },
            'roku-tv': {
              'jcr:description': '',
              'jcr:title': 'Roku TV',
            },
            'vidda-tv ': {
              'jcr:description': '',
              'jcr:title': 'VIDDA TV ',
            },
          },
          audio: {
            'jcr:description': '',
            'jcr:title': 'Audio',
            dolby: {
              'jcr:description': '',
              'jcr:title': 'Dolby',
            },
          },
        },
      },
    ],
    ':type': 'sheet',
  };

  function collectTitles(obj, map) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      if (k.startsWith('jcr:') || k === 'sling:resourceType' || k === 'jcr:primaryType') return;
      const v = obj[k];
      if (v && typeof v === 'object') {
        const trimmedKey = k.trim();
        if (v['jcr:title']) map[trimmedKey] = v['jcr:title'];
        collectTitles(v, map);
      }
    });
  }

  function renderWithTitles(tagsData) {
    const titlesMap = {};
    collectTitles(tagsData, titlesMap);

    function getActiveFiltersContainer() {
      return document.querySelector('.plp-active-filters');
    }

    /**
     * 移除同组的所有 radio filter tag（单选互斥）
     */
    function removeSameGroupFilterTags(inputName, excludeTagPath) {
      if (!inputName) return;
      const selector = `.plp-filter-tag[data-filter-name="${CSS.escape(inputName)}"]${excludeTagPath ? `:not([data-option-value="${CSS.escape(excludeTagPath)}"])` : ''}`;
      const sameNameTags = document.querySelectorAll(selector);
      sameNameTags.forEach((tag) => {
        const srcId = tag.getAttribute('data-source-id');
        if (srcId) {
          const src = document.getElementById(srcId);
          if (src && src.checked) {
            src.checked = false;
          }
        }
        tag.remove();
      });
    }

    /**
     * 移除指定路径的 filter tag
     */
    function removeActiveFilter(tagPath) {
      const container = getActiveFiltersContainer();
      if (!container) return;
      const existing = container.querySelector(`.plp-filter-tag[data-option-value="${CSS.escape(tagPath)}"]`);
      if (existing) existing.remove();
    }

    function createActiveFilterElement(tagPath, labelText, inputId, inputName) {
      const tag = document.createElement('div');
      tag.className = 'plp-filter-tag';
      tag.setAttribute('data-option-value', tagPath);
      if (inputId) tag.setAttribute('data-source-id', inputId);
      if (inputName) tag.setAttribute('data-filter-name', inputName);

      const textSpan = document.createElement('span');
      textSpan.textContent = labelText;
      const closeSpan = document.createElement('span');
      closeSpan.className = 'plp-filter-tag-close';
      closeSpan.textContent = '×';

      closeSpan.addEventListener('click', () => {
        const srcId = tag.getAttribute('data-source-id');
        const filterName = tag.getAttribute('data-filter-name');

        // 如果是 radio 类型，需要移除同组的所有其他 tag
        if (srcId && filterName) {
          const src = document.getElementById(srcId);
          if (src && src.type === 'radio') {
            removeSameGroupFilterTags(filterName, tagPath);
          }
        }

        if (srcId) {
          const src = document.getElementById(srcId);
          if (src && src.checked) {
            src.checked = false;
            src.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        tag.remove();
      });

      tag.append(textSpan, closeSpan);
      return tag;
    }

    function addActiveFilterIfMissing(tagPath, labelText, inputId, inputName) {
      const container = getActiveFiltersContainer();
      if (!container) return;
      const existing = container.querySelector(`.plp-filter-tag[data-option-value="${CSS.escape(tagPath)}"]`);
      if (!existing) {
        const el = createActiveFilterElement(tagPath, labelText, inputId, inputName);
        container.append(el);
      }
    }

    rows.forEach((row, index) => {
      const rowPEl = row.querySelectorAll('p');

      // 判断是否是price slider item.
      let isPriceSlider = false;
      for (let i = 0; i < rowPEl.length; i += 1) {
        if (rowPEl[i].textContent === 'priceSliderItem') {
          isPriceSlider = true;
          break;
        }
      }

      const resource = row.getAttribute('data-aue-resource') || null;
      const cells = [...row.children];
      if (cells.length < 2) return;

      const titleText = cells[0].textContent.trim();
      const tagsCsv = cells[1]?.children[0]?.textContent?.trim?.();
      if (!titleText || !tagsCsv) return;

      const tagType = cells[1].children[1]?.textContent?.trim() || 'checkbox';
      const group = document.createElement('div');
      group.className = index === 0 ? 'plp-filter-group' : 'plp-filter-group hide';
      if (isEditMode && resource) {
        group.setAttribute('data-aue-resource', resource);
      }
      moveInstrumentation(row, group);

      const title = document.createElement('div');
      title.className = 'plp-filter-title';
      const titleSpan = document.createElement('span');
      titleSpan.textContent = titleText;
      const arrow = document.createElement('img');
      arrow.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;

      const toggleExpand = (e) => {
        e.stopPropagation();
        const grandParent = e.target.closest('.plp-filter-group');
        if (!grandParent) { return; }
        grandParent.classList.toggle('hide');
      };

      arrow.addEventListener('click', toggleExpand);
      title.addEventListener('click', toggleExpand);
      title.append(titleSpan, arrow);

      const list = document.createElement('ul');
      list.className = `plp-filter-list plp-tag-${tagType}-group`;

      if (isPriceSlider) {
        priceSliderController = generatePriceSlider(row);
        group.append(title, priceSliderController.element);
      } else {
        // /content/dam/hisense/${country}/common-icons/icon-carousel/radio-empty.svg

        // /content/dam/hisense/${country}/common-icons/icon-carousel/radio.svg

        const tags = tagsCsv.split(',').map((t) => t.trim()).filter(Boolean);
        tags.forEach((tagPath) => {
          const li = document.createElement('li');
          li.className = 'plp-filter-item';

          const input = document.createElement('input');
          input.type = tagType;
          input.value = tagPath;
          if (tagPath === 'hisense:product/tv/connectlife-enabled/no') {
            input.setAttribute('checked', 'checked');
          }
          input.name = `plp-filter-${titleText}`;
          input.setAttribute('data-option-value', tagPath);
          input.id = `plp-filter-${tagCounter}`;
          tagCounter += 1;

          const InputIcon = document.createElement('span');
          InputIcon.className = 'input-icon';
          InputIcon.innerHTML = tagType === 'radio'
            ? `<img class="icon-unchecked" src="/content/dam/hisense/${country}/common-icons/icon-carousel/radio-empty.svg" alt="" />
          <img class="icon-checked" src="/content/dam/hisense/${country}/common-icons/icon-carousel/radio.svg" alt="" />`
            : `<img class="icon-unchecked" src="/content/dam/hisense/${country}/common-icons/icon-carousel/checkbox-empty.svg" alt="" />
          <img class="icon-checked" src="/content/dam/hisense/${country}/common-icons/icon-carousel/checkbox.svg" alt="" />`;

          const label = document.createElement('label');
          label.htmlFor = input.id;
          const parts = tagPath.split('/');
          const lastPart = (parts[parts.length - 1] || tagPath).trim();
          const matchedTitle = titlesMap[lastPart];
          const labelSpan = document.createElement('span');
          labelSpan.textContent = (matchedTitle && String(matchedTitle).trim()) ? matchedTitle : lastPart.replace(/\b\w(.+)?\b/g, (match, rest) => match[0].toUpperCase() + (rest || ''));

          label.append(InputIcon, labelSpan);
          li.append(input, label);
          list.append(li);

          input.addEventListener('change', () => {
            const labelText = label.textContent || lastPart;
            if (input.checked) {
              // 如果是 radio 类型，需要处理单选互斥逻辑
              if (tagType === 'radio' && input.name) {
                // 先移除同组的所有其他 active filter（通过 data-filter-name）
                removeSameGroupFilterTags(input.name, tagPath);
              }
              addActiveFilterIfMissing(tagPath, labelText, input.id, input.name);
            } else {
              // 如果取消选中，移除对应的 active filter
              removeActiveFilter(tagPath);
            }
            if (window && typeof window.applyPlpFilters === 'function') {
              window.applyPlpFilters();
            }
          });
        });
        group.append(title, list);
      }
      fragment.append(group);
    });

    if (isEditMode) {
      const asideElements = [];
      const fragmentChildren = [...fragment.children];
      let childIndex = 0;

      rows.forEach((row) => {
        const aside = document.createElement('aside');
        aside.className = 'plp-sidebar';

        [...row.attributes].forEach((attr) => {
          if (attr.name.startsWith('data-aue-')) {
            aside.setAttribute(attr.name, attr.value);
          }
        });

        if (childIndex < fragmentChildren.length) {
          aside.append(fragmentChildren[childIndex]);
          childIndex += 1;
        }

        asideElements.push(aside);
      });

      block.replaceChildren(...asideElements);
    } else {
      const sidebar = document.createElement('aside');
      sidebar.className = 'plp-sidebar';
      sidebar.append(fragment);
      block.replaceChildren(sidebar);
    }
    // mobile filter 添加标题
    const filterTagWrapperEl = document.querySelector('.product-filter-wrapper');
    const filterTagEl = document.querySelector('.product-filter');
    if (filterTagEl) {
      const titleBoxEl = document.createElement('div');
      titleBoxEl.className = 'plp-mobile-filters-tit-box';
      const mobileProdctTagTit = document.createElement('div');
      mobileProdctTagTit.className = 'mobile-filter-title';
      const mobileFiltersSpan = document.createElement('span');
      mobileFiltersSpan.textContent = 'FILTERS';
      const mobileFiltersImg = document.createElement('img');
      mobileFiltersImg.src = `/content/dam/hisense/${country}/common-icons/mobile-filters-title.svg`;
      mobileFiltersImg.alt = 'Filters title';
      mobileProdctTagTit.append(mobileFiltersImg, mobileFiltersSpan);

      const closeBtn = document.createElement('div');
      closeBtn.className = 'mobile-filter-close';
      const closeImg = document.createElement('img');
      closeImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
      closeImg.alt = 'mobile-filter';
      closeBtn.addEventListener('click', () => {
        filterTagWrapperEl.classList.remove('mobile-filter-show');
        document.body.style.overflow = 'auto';
      });
      closeBtn.append(closeImg);
      titleBoxEl.append(mobileProdctTagTit, closeBtn);
      filterTagEl.prepend(titleBoxEl);
    }

    if (Array.isArray(window.productData) && window.productData.length) {
      refreshPriceSlider(window.productData);
    }
  }

  /**
   * 将新的 GraphQL 返回结构转换为可用的标签数据格式
   * 新的 GraphQL 返回格式直接在根层级包含标签树
   */
  function transformTagData(tagsData) {
    if (!tagsData) return mockTags;

    // 如果返回的已经是旧格式（包含 tags 属性），直接返回
    if (tagsData.tags) {
      return tagsData.tags;
    }

    // 检查是否是包含 data 数组的响应格式（旧兼容格式）
    if (tagsData.data && Array.isArray(tagsData.data)) {
      return tagsData.data[0] || tagsData;
    }

    // 新的 GraphQL 格式：根层级直接包含 product/tv 等标签树
    // 检查是否有 product 或 tv 等顶层标签
    const topLevelKeys = Object.keys(tagsData).filter((key) => !key.startsWith('jcr:')
      && key !== 'sling:resourceType'
      && key !== 'jcr:primaryType');

    // 如果找到了标签层级，说明这是新的 GraphQL 格式
    if (topLevelKeys.length > 0) {
      return tagsData;
    }

    // 默认返回原数据（可能是其他兼容格式）
    return tagsData;
  }

  fetch(getTagsEndpointUrl(tagsEndpointPath))
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      // 使用转换函数处理新的 JSON 格式
      const tagsData = transformTagData(data);
      renderWithTitles(tagsData || mockTags);
    })
    .catch(() => {
      renderWithTitles(mockTags);
    });
}
