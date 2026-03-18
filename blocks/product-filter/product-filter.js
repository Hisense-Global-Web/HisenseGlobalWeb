import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_TAGS_ENDPOINT = '/content/cq:tags/hisense.-1.json';
const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

// 格式化货币函数
const formatCurrency = (num, currencySymbol) => `${currencySymbol} ${parseInt(num, 10).toLocaleString()}`;

// 绑定事件
const bindPriceSlider = (minPrice, maxPrice, currencySymbol, elements) => {
  const {
    minLabel, maxLabel, fillBar, minInput, maxInput,
  } = elements;

  const rangeDiff = maxPrice - minPrice;
  // 更新滑块区域
  function updateSlider() {
    let minVal = parseInt(minInput.value, 10);
    let maxVal = parseInt(maxInput.value, 10);

    // 逻辑限制：左侧不能超过右侧
    if (minVal > maxVal) {
      // 如果正在拖动的是 minInput，把它拉回到 maxVal
      if (document.activeElement === minInput) {
        minInput.value = maxVal;
        minVal = maxVal;
      } else {
        // 如果正在拖动的是 maxInput，把它推到 minVal
        maxInput.value = minVal;
        maxVal = minVal;
      }
    }

    // 计算百分比位置 (0 到 100)
    // 公式：(当前值 - 最小值) / 总差值 * 100
    const minPercent = ((minVal - minPrice) / rangeDiff) * 100;
    const maxPercent = ((maxVal - minPrice) / rangeDiff) * 100;

    // 更新中间青色条的样式
    fillBar.style.left = `${minPercent}%`;
    fillBar.style.width = `${(maxPercent - minPercent)}%`;

    // 更新顶部价格标签的位置和文字
    minLabel.style.left = `${minPercent}%`;
    minLabel.textContent = formatCurrency(minVal, currencySymbol);

    maxLabel.style.left = `${maxPercent}%`;
    maxLabel.textContent = formatCurrency(maxVal, currencySymbol);
  }

  // 绑定事件监听
  minInput.addEventListener('input', updateSlider);
  maxInput.addEventListener('input', updateSlider);

  // 初始化运行一次
  updateSlider();
};

// 构建price slider item.
const generatePriceSlider = (rowEl) => {
  // TODO: 此处需要拿到最大值和最小值
  const MOCK_MIN_PRICE = 500.23;
  const MOCK_MAX_PRICE = 4000.56;
  const minPrice = Math.floor(MOCK_MIN_PRICE);
  const maxPrice = Math.ceil(MOCK_MAX_PRICE);
  const priceSliderWrapper = document.createElement('div');
  priceSliderWrapper.className = 'price-slider-wrapper';
  // eslint-disable-next-line no-unused-vars
  const [titleEl, currencySymbolEl, minLabelEl, maxLabelEl] = [...rowEl.children];
  const currencySymbol = currencySymbolEl?.querySelector('p')?.textContent ?? '$';
  const minLabel = minLabelEl?.querySelector('p')?.textContent ?? '';
  const maxLabel = maxLabelEl?.querySelector('p')?.textContent ?? '';
  const minPriceSymbol = formatCurrency(minPrice, currencySymbol);
  const maxPriceSymbol = formatCurrency(maxPrice, currencySymbol);

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
  bindPriceSlider(minPrice, maxPrice, currencySymbol, {
    minLabel: minPriceTagEl, maxLabel: maxPriceTagEl, fillBar: sliderFillEl, minInput: minInputEl, maxInput: maxInputEl,
  });
  return priceSliderWrapper;
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
        const priceSliderWrapper = generatePriceSlider(row);
        group.append(title, priceSliderWrapper);
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
