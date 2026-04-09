import { isMobileWindow } from '../../scripts/device.js';
import {
  addHybrisCartItem,
  addHybrisWishlistItem,
  buildHybrisCartPageUrl,
  fetchHybrisCart,
  fetchHybrisProduct,
  fetchHybrisWishlist,
  getCachedHybrisAuthState,
  getHybrisProductCode,
  initializeHybrisAuth,
  removeHybrisCartItem,
  removeHybrisWishlistItem,
  scheduleHybrisTask,
  startHybrisLogin,
  updateHybrisCartItem,
} from '../../scripts/hybris-bff.js';
import { getLocaleFromPath, localizeProductApiPath } from '../../scripts/locale-utils.js';
import {
  renderCompareDetailData,
  aggregateData,
  createComparePopup,
  createCompareLiEl,
  compareLiAppendType,
  setCompareProductImgTit,
  appendCompareProductUtil,
} from '../../utils/plp-compare-utils.js';
import shouldShowAddToCartButton, {
  resolveProductCardTagLabel,
  resolvePopupQuantityDisplayState,
  shouldShowPlpFavoriteButton,
} from '../../scripts/commerce-ui-utils.js';

const { country } = getLocaleFromPath();
const STOREFRONT_BASE_URL = 'https://usstorefront.cdrwhdl6-hisenseho2-d1-public.model-t.cc.commerce.ondemand.com';
const STOREFRONT_CART_URL = `${STOREFRONT_BASE_URL}/cart`;
const STOREFRONT_CHECKOUT_URL = new URL('/checkout/delivery-address', STOREFRONT_BASE_URL).toString();
const WISHLIST_CART_NAME_PREFIX = 'wishlist';
const wishlistEntriesByCode = new Map();
let wishlistLoadPromise = null;
let wishlistLoaded = false;
let wishlistRequestVersion = 0;
let wishlistPrimaryCartCode = '';

function setControlLoadingState(element, isLoading) {
  if (!element) {
    return;
  }

  element.dataset.loading = isLoading ? 'true' : 'false';
  element.classList.toggle('is-loading', isLoading);
  if (isLoading) {
    element.setAttribute('aria-busy', 'true');
  } else {
    element.removeAttribute('aria-busy');
  }
}

function scheduleControlLoadingReset(element, delay = 1500) {
  if (!element) {
    return;
  }

  window.setTimeout(() => {
    if (!document.body.contains(element) || document.visibilityState === 'hidden') {
      return;
    }
    setControlLoadingState(element, false);
  }, delay);
}

function normalizeWishlistKey(value) {
  return String(value || '').trim();
}

function addWishlistKey(keys, value) {
  const normalizedKey = normalizeWishlistKey(value);
  if (normalizedKey) {
    keys.add(normalizedKey);
  }
}

function collectWishlistKeys(...sources) {
  const keys = new Set();

  sources.forEach((source) => {
    if (!source) {
      return;
    }

    if (typeof source === 'string') {
      addWishlistKey(keys, source);
      return;
    }

    addWishlistKey(keys, source.code);
    addWishlistKey(keys, source.sku);
    addWishlistKey(keys, source.productCode);
    addWishlistKey(keys, source.materialNumber);
    addWishlistKey(keys, source.overseasModel);

    if (source.product) {
      collectWishlistKeys(source.product).forEach((key) => keys.add(key));
    }
    if (source.item) {
      collectWishlistKeys(source.item).forEach((key) => keys.add(key));
    }
    if (source.entry) {
      collectWishlistKeys(source.entry).forEach((key) => keys.add(key));
    }
  });

  return [...keys];
}

function getWishlistEntryByProductCode(productCode = '') {
  const normalizedKey = normalizeWishlistKey(productCode);
  if (!normalizedKey) {
    return null;
  }
  return wishlistEntriesByCode.get(normalizedKey) || null;
}

function setWishlistEntry(entry, ...sources) {
  collectWishlistKeys(entry, ...sources).forEach((key) => {
    wishlistEntriesByCode.set(key, entry);
  });
}

function deleteWishlistEntry(entry, ...sources) {
  collectWishlistKeys(entry, ...sources).forEach((key) => {
    wishlistEntriesByCode.delete(key);
  });
}

function syncWishlistFavoriteElements() {
  document.querySelectorAll('.plp-favorite[data-product-code]').forEach((favorite) => {
    const productCode = favorite.getAttribute('data-product-code') || '';
    favorite.classList.toggle('selected', Boolean(getWishlistEntryByProductCode(productCode)));
  });
}

function isWishlistCart(cart) {
  const normalizedName = String(cart?.name || '').trim().toLowerCase();
  return Boolean(normalizedName && normalizedName.startsWith(WISHLIST_CART_NAME_PREFIX));
}

function getWishlistCarts(payload) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.carts)) {
    return payload.carts.filter(isWishlistCart);
  }

  if (Array.isArray(payload.entries) && isWishlistCart(payload)) {
    return [payload];
  }

  return [];
}

function resolveWishlistCartCode(payload) {
  const [wishlistCart] = getWishlistCarts(payload);
  if (wishlistCart?.code) {
    return String(wishlistCart.code).trim();
  }

  if (isWishlistCart(payload) && payload?.code) {
    return String(payload.code).trim();
  }

  if (payload?.wishlist) {
    return resolveWishlistCartCode(payload.wishlist);
  }

  return '';
}

function normalizeWishlistItems(payload) {
  if (!payload) {
    return [];
  }

  const wishlistCarts = getWishlistCarts(payload);
  if (wishlistCarts.length) {
    return wishlistCarts.flatMap((cart) => {
      const entries = Array.isArray(cart.entries) ? cart.entries : [];
      return entries.map((entry) => ({
        ...entry,
        cartCode: entry?.cartCode || cart.code || '',
      }));
    });
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.entries)) {
    if (!isWishlistCart(payload)) {
      return [];
    }
    return payload.entries.map((entry) => ({
      ...entry,
      cartCode: entry?.cartCode || payload.code || payload.cartCode || '',
    }));
  }

  if (payload.wishlist) {
    return normalizeWishlistItems(payload.wishlist);
  }

  return [];
}

function getWishlistEntryData(payload, fallbackCode = '', fallbackCartCode = '') {
  if (!payload) {
    return null;
  }

  const candidate = payload.product ? payload : (payload.item || payload.entry || payload);
  const code = getHybrisProductCode(candidate.product || candidate) || fallbackCode;
  const entryNumber = candidate.entryNumber
    ?? candidate.item?.entryNumber
    ?? candidate.entry?.entryNumber
    ?? null;
  const cartCode = candidate.cartCode
    || candidate.item?.cartCode
    || candidate.entry?.cartCode
    || payload.cartCode
    || fallbackCartCode
    || '';

  if (code && entryNumber !== null && entryNumber !== undefined) {
    return { code, entryNumber, cartCode };
  }

  const wishlistItems = normalizeWishlistItems(payload);
  const matchedItem = wishlistItems.find((item) => getHybrisProductCode(item.product || item) === fallbackCode)
    || wishlistItems[0];

  if (!matchedItem) {
    return null;
  }

  return getWishlistEntryData(matchedItem, fallbackCode, fallbackCartCode || resolveWishlistCartCode(payload));
}

function syncWishlistEntries(payload) {
  wishlistPrimaryCartCode = resolveWishlistCartCode(payload);
  wishlistEntriesByCode.clear();
  normalizeWishlistItems(payload).forEach((item) => {
    const entry = getWishlistEntryData(item, '', item?.cartCode || wishlistPrimaryCartCode);
    if (entry?.code) {
      setWishlistEntry(entry, item, item?.product);
    }
  });
  syncWishlistFavoriteElements();
  return wishlistEntriesByCode;
}

function bumpWishlistVersion() {
  wishlistRequestVersion += 1;
  return wishlistRequestVersion;
}

function notifyPlpProductsReady(items) {
  document.dispatchEvent(new CustomEvent('hisense:plp-products-ready', {
    detail: {
      items: Array.isArray(items) ? items : [],
    },
  }));
}

function isPriceFilterActive() {
  if (typeof window.getPlpPriceFilterState !== 'function') {
    return false;
  }

  const state = window.getPlpPriceFilterState();
  if (!state?.ready) {
    return false;
  }

  return Number(state.selectedMin) > Number(state.min)
    || Number(state.selectedMax) < Number(state.max);
}

function rebindPriceSpiderWidgets() {
  if (typeof window === 'undefined') {
    return;
  }

  window.setTimeout(() => {
    if (window.PriceSpider && typeof window.PriceSpider.rebind === 'function') {
      window.PriceSpider.rebind();
    }
  }, 0);
}

async function ensureWishlistLoaded(force = false) {
  const authState = getCachedHybrisAuthState();
  if (!authState.authenticated) {
    bumpWishlistVersion();
    wishlistPrimaryCartCode = '';
    wishlistEntriesByCode.clear();
    wishlistLoaded = false;
    syncWishlistFavoriteElements();
    return wishlistEntriesByCode;
  }

  if (!force && wishlistLoaded) {
    return wishlistEntriesByCode;
  }

  if (!force && wishlistLoadPromise) {
    return wishlistLoadPromise;
  }

  const requestVersion = bumpWishlistVersion();
  wishlistLoadPromise = fetchHybrisWishlist({
    redirectOnAuthFailure: true,
    returnUrl: window.location.href,
  })
    .then((payload) => {
      if (requestVersion !== wishlistRequestVersion) {
        return wishlistEntriesByCode;
      }
      syncWishlistEntries(payload);
      wishlistLoaded = true;
      return wishlistEntriesByCode;
    })
    .finally(() => {
      wishlistLoadPromise = null;
    });

  return wishlistLoadPromise;
}

function parsePriceValue(price) {
  if (!price) {
    return {
      value: null,
      formattedValue: '',
      currencyIso: '',
    };
  }

  const numericValue = Number(price.value);
  return {
    value: Number.isFinite(numericValue) ? numericValue : null,
    formattedValue: price.formattedValue || '',
    currencyIso: price.currencyIso || price.currency || '',
  };
}

function formatCurrencyValue(value, currencyIso = 'USD') {
  if (!Number.isFinite(value)) {
    return '';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyIso || 'USD',
    }).format(value);
  } catch (error) {
    return `${currencyIso || '$'} ${value}`;
  }
}

function parseLoosePriceValue(price, fallbackCurrency = 'USD') {
  if (price === null || price === undefined || price === '') {
    return {
      value: null,
      formattedValue: '',
      currencyIso: fallbackCurrency,
    };
  }

  if (typeof price === 'number') {
    return {
      value: price,
      formattedValue: formatCurrencyValue(price, fallbackCurrency),
      currencyIso: fallbackCurrency,
    };
  }

  if (typeof price === 'object') {
    return parsePriceValue({
      ...price,
      currencyIso: price.currencyIso || price.currency || fallbackCurrency,
    });
  }

  const text = String(price).trim();
  const numericText = text.replace(/[^0-9.-]/g, '');
  const numericValue = Number(numericText);

  return {
    value: Number.isFinite(numericValue) ? numericValue : null,
    formattedValue: text,
    currencyIso: fallbackCurrency,
  };
}

function getPriceDisplayText(price, fallbackCurrency) {
  if (!price) {
    return '';
  }

  if (price.formattedValue) {
    return price.formattedValue;
  }

  return formatCurrencyValue(price.value, price.currencyIso || fallbackCurrency || 'USD');
}

function getPriceParts(price, fallbackCurrency = 'USD') {
  if (!price) {
    return {
      currency: '',
      amount: '',
      full: '',
    };
  }

  if (price.value !== null && price.value !== undefined) {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currencyIso || fallbackCurrency || 'USD',
      });
      const parts = formatter.formatToParts(price.value);
      return {
        currency: parts.filter((part) => part.type === 'currency').map((part) => part.value).join(''),
        amount: parts
          .filter((part) => part.type !== 'currency')
          .map((part) => part.value)
          .join('')
          .trim(),
        full: formatter.format(price.value),
      };
    } catch (error) {
      // fall through to formatted string parsing
    }
  }

  const full = getPriceDisplayText(price, fallbackCurrency);
  const matched = full.match(/^([^0-9-]*)(.*)$/);

  return {
    currency: matched?.[1]?.trim() || '',
    amount: matched?.[2]?.trim() || full,
    full,
  };
}

function getPricingDetails(product, fallbackSource = null) {
  const pricing = product?.pricing || {};
  const fallbackPriceInfo = fallbackSource?.priceInfo || {};
  const fallbackCurrency = pricing.currency
    || product?.price?.currencyIso
    || product?.msrp?.currencyIso
    || fallbackPriceInfo.currency
    || fallbackPriceInfo.currencyIso
    || 'USD';

  const fallbackSale = parseLoosePriceValue(
    fallbackPriceInfo.specialprice
      || fallbackPriceInfo.specialPrice
      || fallbackSource?.priceInfo_specialprice
      || fallbackSource?.specialPrice
      || fallbackSource?.price,
    fallbackCurrency,
  );
  const fallbackMsrp = parseLoosePriceValue(
    fallbackPriceInfo.regularPrice
      || fallbackPriceInfo.regularprice
      || fallbackSource?.priceInfo_regularPrice
      || fallbackSource?.regularPrice,
    fallbackCurrency,
  );

  const sale = parsePriceValue(pricing.sale || pricing.price || pricing.current || product?.price);
  const msrp = parsePriceValue(pricing.msrp || pricing.original || pricing.list || product?.msrp);
  let resolvedSale = sale;
  if (resolvedSale.value === null && !resolvedSale.formattedValue) {
    if (fallbackSale.value !== null || fallbackSale.formattedValue) {
      resolvedSale = fallbackSale;
    } else {
      resolvedSale = msrp;
    }
  }
  const resolvedMsrp = (msrp.value !== null || msrp.formattedValue) ? msrp : fallbackMsrp;
  const currency = pricing.currency
    || resolvedSale.currencyIso
    || resolvedMsrp.currencyIso
    || fallbackCurrency
    || 'USD';

  return {
    sale: resolvedSale,
    msrp: resolvedMsrp,
    currency,
  };
}

function hasInventory(product) {
  const stock = product?.stock || {};
  const level = Number(stock.level ?? stock.stockLevel);
  const status = String(stock.status || stock.stockLevelStatus || '').toLowerCase();

  return Boolean(
    (Number.isFinite(level) && level > 0)
    || ['instock', 'in_stock', 'available', 'lowstock', 'low_stock'].includes(status),
  );
}
function applyAggregatedSort(sortProperty, direction = -1) {
  try {
    // 检查是否有已选中的 filter
    const hasActiveFilters = () => {
      const filterTags = document.querySelectorAll('.plp-filter-tag');
      return (filterTags && filterTags.length > 0) || isPriceFilterActive();
    };

    // 如果有筛选结果，就在筛选结果基础上排序，否则使用原始数据进行排序
    let listToSort;
    if (hasActiveFilters()) {
      // 使用当前筛选结果进行排序
      listToSort = window.filteredProducts.slice();
    } else if (Array.isArray(window.productData)) {
      // 使用全部产品数据进行排序
      listToSort = window.productData.slice();
    } else {
      listToSort = [];
    }

    // 通过 key 获取 product model
    const getPropertyByKey = (item, propKey) => {
      if (!item || !propKey) return undefined;
      if (Object.prototype.hasOwnProperty.call(item, propKey)) return item[propKey];
      const parts = propKey.includes('.') ? propKey.split('.') : propKey.split('_');
      return parts.reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), item);
    };

    // 序列化属性，排序属性的值类型中包含尺寸，时间，价格
    const normalizeValueForSort = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T/.test(value)) {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? String(value).toLowerCase() : parsed;
      }
      if (typeof value === 'string' && sortProperty.toLowerCase().includes('size')) {
        const m = value.match(/(\d+(\.\d+)?)/);
        if (m) return parseFloat(m[1]);
      }
      return String(value).toLowerCase();
    };

    // factoryModel 分组，计算每个组在指定属性上的最大
    const groupedByFactoryModel = {};
    const factoryModelMaxValues = {};

    listToSort.forEach((item) => {
      const { factoryModel } = item;
      if (!groupedByFactoryModel[factoryModel]) {
        groupedByFactoryModel[factoryModel] = [];
      }
      groupedByFactoryModel[factoryModel].push(item);

      // 计算factoryModel 在指定属性上的最大
      const value = normalizeValueForSort(getPropertyByKey(item, sortProperty));
      if (value !== null && value !== undefined) {
        if (!factoryModelMaxValues[factoryModel]
            || (typeof value === 'number' && typeof factoryModelMaxValues[factoryModel] === 'number' && value > factoryModelMaxValues[factoryModel])
            || (typeof value === 'string' && typeof factoryModelMaxValues[factoryModel] === 'string' && String(value).localeCompare(String(factoryModelMaxValues[factoryModel])) > 0)) {
          factoryModelMaxValues[factoryModel] = value;
        }
      }
    });

    const getProductSeries = (item) => {
      if (!item) return '';
      if (item.series) return item.series;
      return item.sku || '';
    };

    // 按最大值进行排序，当最大值相同时按标题Z-A排序
    const sortedProducts = listToSort.slice().sort((a, b) => {
      const maxValueA = factoryModelMaxValues[a.factoryModel];
      const maxValueB = factoryModelMaxValues[b.factoryModel];

      // 处理空值
      if (maxValueA === null || maxValueA === undefined) return 1 * direction;
      if (maxValueB === null || maxValueB === undefined) return -1 * direction;

      // 比较最大
      let compareResult = 0;
      if (maxValueA === maxValueB) {
        // 先按首字母Z-A排序，首字母相同再按数字9-0排序
        const titleA = getProductSeries(a);
        const titleB = getProductSeries(b);

        // 先按首字母Z-A排序
        const firstCharA = String(titleA).charAt(0).toUpperCase();
        const firstCharB = String(titleB).charAt(0).toUpperCase();
        const charCompare = firstCharB.localeCompare(firstCharA); // Z-A排序

        if (charCompare !== 0) {
          compareResult = charCompare;
        } else {
          // 首字母相同，比较第二个字符，字母排在数字前面
          const secondCharA = String(titleA).charAt(1);
          const secondCharB = String(titleB).charAt(1);
          const isAlphaA = /^[A-Z]/i.test(secondCharA);
          const isAlphaB = /^[A-Z]/i.test(secondCharB);

          if (isAlphaA !== isAlphaB) {
            // 一个是字母，一个是数字，字母排在前面
            compareResult = isAlphaA ? -1 : 1;
          } else {
            // 都是字母或都是数字，按数字9-0排序
            const numA = parseFloat(titleA.replace(/[^\d.]/g, '')) || 0;
            const numB = parseFloat(titleB.replace(/[^\d.]/g, '')) || 0;
            compareResult = numB - numA; // 数字大的在前
          }
        }
      } else if (typeof maxValueA === 'number' && typeof maxValueB === 'number') {
        compareResult = (maxValueA - maxValueB) * direction;
      } else {
        compareResult = String(maxValueA).localeCompare(String(maxValueB)) * direction;
      }

      return compareResult;
    });

    // 如果是按尺寸排序，设置标志表示产品卡片应默认选中最大尺寸
    if (!sortProperty || sortProperty === 'size') {
      window.isDefaultSortApplied = true;
    } else {
      window.isDefaultSortApplied = false;
    }

    window.renderPlpProducts(sortedProducts);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn('Aggregated sort error:', e);
  }
}
export default function decorate(block) {
  const isEditMode = block && block.hasAttribute && block.hasAttribute('data-aue-resource');
  block.classList.add('plp-product-card');
  block.classList.remove('product-card');

  const rows = [...(block.children || [])];
  let graphqlUrl = null;
  let graphqlResource = null;
  let fields = [];
  let fieldsResource = null;
  let loadMoreTextContent = null;
  let loadMoreLink = null;
  let noResultMessage = null;

  rows.forEach((row, index) => {
    const resource = row.getAttribute && row.getAttribute('data-aue-resource');
    const anchor = row.querySelector && row.querySelector('a');
    const text = row.textContent && row.textContent.trim();

    if (index === 0) {
      // 第一行：graphqlUrl
      if (anchor) {
        graphqlUrl = anchor.getAttribute('href') || anchor.textContent.trim();
        graphqlResource = resource || anchor.getAttribute('data-aue-resource') || null;
      } else if (text) {
        graphqlUrl = text;
        graphqlResource = resource;
      }
    } else if (index === 1) {
      // 第二行：fields
      if (text && text.indexOf(',') >= 0) {
        fields = text.split(',').map((s) => s.trim()).filter(Boolean);
        fieldsResource = resource;
      }
    } else if (index === 2) {
      // 第三行：loadMoreTextContent
      if (text) {
        loadMoreTextContent = text;
      }
    } else if (index === 3) {
      // 第四行：loadMoreLink
      if (anchor) {
        loadMoreLink = anchor.getAttribute('href') || anchor.textContent.trim();
      } else if (text) {
        loadMoreLink = text;
      }
    } else if (index === 4) {
      // 第五行：noResultMessage
      if (text) {
        noResultMessage = row.innerHTML;
      }
    }
  });

  rows.forEach((row) => {
    if (row && row.parentNode) row.parentNode.removeChild(row);
  });

  const productsBox = document.createElement('div');
  productsBox.className = 'plp-products-box';
  const productsGrid = document.createElement('div');
  productsGrid.className = 'plp-products';
  const productsLoadMore = document.createElement('div');
  productsLoadMore.className = 'plp-load-more';
  // const loadMoreUrl = loadMoreLink || '#';
  // 新增：分页相关状态
  let currentPage = 1;
  const loadMoreStep = 27;
  let allGroupedData = []; // 存储所有聚合后的产品数据
  let compareDataArr = []; // 存储比较的产品数据

  // 修改：Load More 点击逻辑
  productsLoadMore.addEventListener('click', () => {
    currentPage += 1;
    // eslint-disable-next-line no-use-before-define
    renderPagedItems();
    // 更新Load More显示状态
    // eslint-disable-next-line no-use-before-define
    updateLoadMoreVisibility();
  });

  const span = document.createElement('span');
  span.textContent = loadMoreTextContent || 'Load more';

  const productsNoResult = document.createElement('div');
  productsNoResult.className = 'plp-products-no-result';
  productsNoResult.innerHTML = noResultMessage || '<p>no result</p>';
  productsNoResult.style.display = 'none';

  productsLoadMore.append(span);
  productsBox.append(productsGrid);
  productsBox.append(productsLoadMore);
  productsBox.append(productsNoResult);

  if (isEditMode) {
    const topWrapper = document.createElement('div');

    const btnRow = document.createElement('div');
    const p = document.createElement('p');
    p.className = 'button-container';
    const a = document.createElement('a');
    a.className = 'button';
    a.title = graphqlUrl || '';
    a.href = graphqlUrl || '#';
    a.textContent = graphqlUrl || '';
    if (graphqlResource) {
      a.setAttribute('data-aue-resource', graphqlResource);
    }

    p.appendChild(a);
    btnRow.appendChild(p);
    topWrapper.appendChild(btnRow);

    const fieldsRow = document.createElement('div');
    const fieldsInner = document.createElement('div');
    const pf = document.createElement('p');
    pf.textContent = fields.join(',');
    fieldsInner.appendChild(pf);
    if (fieldsResource) fieldsInner.setAttribute('data-aue-resource', fieldsResource);
    fieldsRow.appendChild(fieldsInner);
    topWrapper.appendChild(fieldsRow);

    const loadMoreLinkRow = document.createElement('div');
    const loadMoreLinkInner = document.createElement('div');
    const loadMoreLinkP = document.createElement('p');
    const loadMoreLinkA = document.createElement('a');
    loadMoreLinkA.href = loadMoreLink || '#';
    loadMoreLinkA.title = loadMoreLink || '';
    loadMoreLinkA.textContent = loadMoreLink || '';
    loadMoreLinkA.className = 'button';
    loadMoreLinkP.appendChild(loadMoreLinkA);
    loadMoreLinkInner.appendChild(loadMoreLinkP);
    loadMoreLinkRow.appendChild(loadMoreLinkInner);
    topWrapper.appendChild(loadMoreLinkRow);

    block.replaceChildren(topWrapper, productsBox);
  } else {
    block.replaceChildren(productsBox);
  }

  if (!graphqlUrl) return;

  const authReadyPromise = scheduleHybrisTask(() => initializeHybrisAuth());

  /**
   * 比较 ----- start
   */

  // 移除底部固定栏中，对比数据dom集合中对应 li 元素
  function removeCompareLiUtil(removeProductSku) {
    const activeCompareLiAll = document.querySelectorAll('.active-compare');
    // 移除比较数据集合中的对应 li
    activeCompareLiAll.forEach((compareLiItem) => {
      if (compareLiItem.dataset.compareId === removeProductSku) {
        compareLiItem.remove();
        appendCompareProductUtil();
      }
    });
    // 如果选中的比较数据只有一条了，要禁用 compare 按钮
    if (compareDataArr.length === 1) {
      document.querySelector('.plp-compare-btn').classList.add('compare-disabled');
    }
  }

  // 隐藏 compare bar 底部固定栏
  function hideCompareBar() {
    if (compareDataArr.length < 1) {
      document.querySelector('.plp-compare-bar').classList.remove('compare-bar-show');
    }
  }

  /**
   * 切换属性时，比较数据要做对应的清空
   * @param {*} changeElement 当前切换的 dom 元素
   */
  function changeCardSelectedProperty(changeElement) {
    // 切换该商品size 时，要把之前比较数据中已经添加的该商品的尺寸属性清空
    const originCompareSku = changeElement.closest('.product-card').getAttribute('data-compare-id');
    // 1、过滤比较商品数据源
    compareDataArr = compareDataArr.filter((comDataItem) => comDataItem.sku !== originCompareSku);
    // 2、取消商品 card 上【Compare】按钮选中状态
    const compareCheckedAllEl = document.querySelectorAll('.compare-checked');
    compareCheckedAllEl.forEach((comCheckedItem) => {
      const cardCheckedSku = comCheckedItem.getAttribute('data-compare-id');
      if (cardCheckedSku === originCompareSku) {
        comCheckedItem.classList.remove('compare-checked');
      }
    });
    // 3、移动询问固定栏中对应商品的LI 元素
    removeCompareLiUtil(originCompareSku);
    // 4、底部固定比较栏在对比数据小于2条时，不展示
    hideCompareBar();
  }

  // 页面底部固定栏，比较商品固定栏
  function fixedBottomCompareBar() {
    const compareBarEl = document.createElement('div');
    compareBarEl.className = 'plp-compare-bar';
    const compareCardList = document.createElement('ul');
    compareCardList.className = 'plp-compare-cards';

    // add compare button and compare bar close button
    const compareBtnEl = document.createElement('div');
    compareBtnEl.className = 'plp-compare-btn';
    compareBtnEl.textContent = 'Compare';
    // 显示对比详细信息弹窗
    compareBtnEl.addEventListener('click', () => {
      // 对比数据小于2条时，不展示对比弹窗
      if (compareDataArr.length === 1) {
        return;
      }
      document.body.style.overflow = 'hidden';
      // 比较商品信息详细数据
      const compareDetailInfo = aggregateData(compareDataArr);
      // 每次点击 compare 按钮，重新渲染比较商品信息 popup
      createComparePopup();
      // render compare popup detail data
      renderCompareDetailData(compareDetailInfo, 'property-box-id');
      // document.querySelector('.compare-popup-wrapper').style.display = 'block';
      document.querySelector('.compare-popup-wrapper').style.visibility = 'visible';
    });
    const compareBarCloseBtn = document.createElement('img');
    compareBarCloseBtn.className = 'plp-compare-bar-close';
    compareBarCloseBtn.src = `/content/dam/hisense/${country}/common-icons/close-50.svg`;
    compareBarCloseBtn.alt = 'Close';
    // 底部固定栏上的关闭按钮点击事件
    compareBarCloseBtn.addEventListener('click', () => {
      compareBarEl.classList.remove('compare-bar-show');
      // 重置比较数据为空
      compareDataArr = [];
      // 所有 product card 【Compare】按钮取消选中状态
      const cardCompareBtnAll = document.querySelectorAll('.compare-checked');
      cardCompareBtnAll.forEach((item) => {
        item.classList.remove('compare-checked');
      });
      // 重置底部比较栏dom 元素
      const compareBarLiAll = document.querySelectorAll('.plp-compare-cards li');
      compareBarLiAll.forEach((resetLi) => {
        resetLi.classList.remove('active-compare');
        resetLi.setAttribute('data-compare-id', '');
        resetLi.querySelector('.compare-img-box img').src = '';
        resetLi.querySelector('.compare-product-title').textContent = '';
      });
      if (isMobileWindow()) {
        const footerWrapper = document.querySelector('.footer-wrapper');
        footerWrapper.style.paddingBottom = 0;
      }
    });

    compareBarEl.append(compareCardList, compareBtnEl, compareBarCloseBtn);
    // const mainEl = document.querySelector('main');
    // mainEl.appendChild(compareBarEl);
    document.body.appendChild(compareBarEl);
    // 为询问固定栏，初始化追加三个li 元素
    createCompareLiEl(compareLiAppendType.initCompareLi);
  }

  /**
   * 比较 ----- end
   */

  function extractImageFromShortDescription(item) {
    if (!item || !item.description_shortDescription || !item.description_shortDescription.html) {
      return null;
    }

    const { html } = item.description_shortDescription;
    // 从 <p> 标签中提取文本内容
    const match = html.match(/<p>([^<]+)<\/p>/);
    return match ? match[1].trim() : null;
  }

  function getVariantImageUrl(variant) {
    if (!variant) {
      return '';
    }

    if (window.useShortDescriptionAsImage) {
      return extractImageFromShortDescription(variant) || '';
    }

    const imageKey = variant.mediaGallery_image
      && Object.keys(variant.mediaGallery_image).find((key) => key.toLowerCase().includes('_path'));
    return imageKey ? variant.mediaGallery_image[imageKey] : '';
  }

  function getProductDisplayTitle(product, fallbackTitle = '') {
    if (!product) {
      return fallbackTitle || '';
    }

    const metadataKey = Object.keys(product).find((key) => key.toLowerCase().includes('metadata'));
    let metadataTitle = '';
    if (metadataKey) {
      const metadata = product[metadataKey];
      if (metadata && Array.isArray(metadata.stringMetadata)) {
        metadataTitle = metadata.stringMetadata.find((entry) => entry.name === 'title')?.value || '';
      }
    }

    return product.name
      || product.title
      || metadataTitle
      || product.factoryModel
      || product.series
      || product.sku
      || fallbackTitle
      || '';
  }

  function normalizeCartEntries(cart) {
    if (!cart) {
      return [];
    }

    if (Array.isArray(cart.entries)) {
      return cart.entries;
    }

    if (Array.isArray(cart.items)) {
      return cart.items;
    }

    if (Array.isArray(cart.carts)) {
      return cart.carts.flatMap((childCart) => normalizeCartEntries(childCart));
    }

    if (cart.entry) {
      return normalizeCartEntries(cart.entry);
    }

    if (cart.item) {
      return normalizeCartEntries(cart.item);
    }

    if (cart.product) {
      return [cart];
    }

    return [];
  }

  function getCartEntryQuantity(entry) {
    const quantity = Number(entry?.quantity ?? entry?.entry?.quantity ?? entry?.item?.quantity);
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  }

  function getCartEntryNumber(entry) {
    const entryNumber = Number(entry?.entryNumber ?? entry?.entry?.entryNumber ?? entry?.item?.entryNumber);
    return Number.isInteger(entryNumber) && entryNumber >= 0 ? entryNumber : null;
  }

  function getCartTotalUnitCount(cart) {
    const totalUnitCount = Number(cart?.totalUnitCount);
    if (Number.isFinite(totalUnitCount) && totalUnitCount > 0) {
      return totalUnitCount;
    }

    const totalQuantity = normalizeCartEntries(cart)
      .reduce((total, entry) => total + getCartEntryQuantity(entry), 0);
    if (totalQuantity > 0) {
      return totalQuantity;
    }

    const totalItems = Number(cart?.totalItems);
    return Number.isFinite(totalItems) && totalItems > 0 ? totalItems : 0;
  }

  function getCartTotalPrice(cart) {
    return parsePriceValue(cart?.totalPriceWithTax || cart?.totalPrice || cart?.subTotal);
  }

  function getPopupTotalPriceText(cart, entry, unitPrice, fallbackCurrency = 'USD') {
    const cartTotalPrice = getCartTotalPrice(cart);
    if (cartTotalPrice.formattedValue || cartTotalPrice.value !== null) {
      return getPriceDisplayText(cartTotalPrice, fallbackCurrency);
    }

    const entryTotalPrice = parsePriceValue(entry?.totalPrice);
    if (entryTotalPrice.formattedValue || entryTotalPrice.value !== null) {
      return getPriceDisplayText(entryTotalPrice, fallbackCurrency);
    }

    const quantity = getCartEntryQuantity(entry);
    if (quantity > 0 && unitPrice?.value !== null) {
      return getPriceDisplayText({
        value: unitPrice.value * quantity,
        currencyIso: unitPrice.currencyIso || fallbackCurrency,
      }, fallbackCurrency);
    }

    return '--';
  }

  function findCartEntryByProductCode(cart, productCode) {
    const normalizedProductCode = String(productCode || '').trim();
    if (!normalizedProductCode) {
      return null;
    }

    return normalizeCartEntries(cart)
      .find((entry) => getHybrisProductCode(entry?.product || entry) === normalizedProductCode) || null;
  }

  function getPopupEntryFallback(payload, productCode) {
    if (!payload) {
      return null;
    }

    return findCartEntryByProductCode(payload, productCode)
      || payload.entry
      || payload.item
      || (payload.product ? payload : null);
  }

  function getPopupEntryPrice(entry, fallbackSource = null) {
    const basePrice = parsePriceValue(entry?.basePrice || entry?.product?.price || entry?.price);
    if (basePrice.formattedValue || basePrice.value !== null) {
      return basePrice;
    }

    const totalPrice = parsePriceValue(entry?.totalPrice);
    const quantity = getCartEntryQuantity(entry);
    if (totalPrice.value !== null && quantity > 0) {
      return {
        value: totalPrice.value / quantity,
        formattedValue: '',
        currencyIso: totalPrice.currencyIso || 'USD',
      };
    }

    const { sale, msrp, currency } = getPricingDetails(fallbackSource, fallbackSource);
    if (sale.formattedValue || sale.value !== null) {
      return sale;
    }

    return {
      ...msrp,
      currencyIso: msrp.currencyIso || currency,
    };
  }

  function resolvePopupImageUrl(entry, fallbackVariant = null, fallbackRepresentative = null) {
    const entryImages = Array.isArray(entry?.product?.images) ? entry.product.images : [];
    const entryImage = entryImages.find((image) => image?.url) || entryImages[0];

    return entryImage?.url
      || getVariantImageUrl(fallbackVariant)
      || getVariantImageUrl(fallbackRepresentative)
      || '';
  }

  const popupState = {
    productCode: '',
    authenticated: false,
    cart: null,
    entry: null,
    variant: null,
    representative: null,
    message: 'Item added to your cart',
    processing: false,
    quantityLoading: false,
    pendingQuantityAction: '',
  };

  const cartCacheState = {
    cart: null,
    hydrated: false,
    loadPromise: null,
  };

  const popupElements = {
    popup: null,
    mask: null,
    title: null,
    image: null,
    productTitle: null,
    modelValue: null,
    stockLine: null,
    stockText: null,
    unitPrice: null,
    totalLabel: null,
    totalPrice: null,
    countControls: [],
    deleteIcons: [],
    viewCartBtn: null,
    checkoutBtn: null,
  };

  function setProductCardPopupVisibility(visible) {
    if (!popupElements.popup || !popupElements.mask) {
      return;
    }

    popupElements.popup.style.display = visible ? 'block' : '';
    popupElements.mask.style.display = visible ? 'block' : '';
  }

  function closeProductCardPopup() {
    setProductCardPopupVisibility(false);
  }

  function setCachedProductCardCart(cart) {
    cartCacheState.cart = cart || null;
    cartCacheState.hydrated = true;
    return cartCacheState.cart;
  }

  function setPopupQuantityLoadingState(action = '') {
    const normalizedAction = String(action || '').trim().toLowerCase();
    popupState.pendingQuantityAction = normalizedAction;
    popupState.quantityLoading = ['increase', 'decrease'].includes(normalizedAction);
  }

  function renderProductCardPopup() {
    if (!popupElements.popup) {
      return;
    }

    const fallbackProduct = popupState.variant || popupState.representative || {};
    const { entry } = popupState;
    const entryProduct = entry?.product || {};
    const fallbackCurrency = entry?.basePrice?.currencyIso
      || entry?.totalPrice?.currencyIso
      || popupState.cart?.totalPrice?.currencyIso
      || popupState.cart?.subTotal?.currencyIso
      || 'USD';
    const unitPrice = getPopupEntryPrice(entry, fallbackProduct);
    const quantity = getCartEntryQuantity(entry);
    const entryNumber = getCartEntryNumber(entry);
    const canAdjustExistingEntry = entryNumber !== null && quantity > 0;
    const totalUnitCount = getCartTotalUnitCount(popupState.cart) || quantity;
    const itemLabel = totalUnitCount === 1 ? 'item' : 'items';
    const quantityDisplayState = resolvePopupQuantityDisplayState({
      quantity,
      quantityLoading: popupState.quantityLoading,
      pendingQuantityAction: popupState.pendingQuantityAction,
    });
    const productTitle = getProductDisplayTitle(
      entryProduct,
      getProductDisplayTitle(fallbackProduct, popupState.productCode),
    );
    const modelValue = entryProduct.code || popupState.productCode || getHybrisProductCode(fallbackProduct);
    const imageUrl = resolvePopupImageUrl(entry, popupState.variant, popupState.representative);
    const stockSource = entryProduct?.stock ? entryProduct : fallbackProduct;
    const hasStockInfo = Boolean(stockSource?.stock);

    popupElements.title.textContent = popupState.processing ? 'Updating your cart' : popupState.message;
    popupElements.productTitle.textContent = productTitle || popupState.productCode || '';
    popupElements.modelValue.textContent = modelValue || '--';
    popupElements.unitPrice.textContent = getPriceDisplayText(unitPrice, fallbackCurrency) || '--';
    popupElements.totalLabel.innerHTML = `Cart total (<span class="total-num">${totalUnitCount || 0}</span> ${itemLabel})`;
    popupElements.totalPrice.textContent = getPopupTotalPriceText(
      popupState.cart,
      entry,
      unitPrice,
      fallbackCurrency,
    );

    if (imageUrl) {
      popupElements.image.src = imageUrl;
      popupElements.image.alt = productTitle || modelValue || 'Product image';
    } else {
      popupElements.image.removeAttribute('src');
      popupElements.image.alt = '';
    }

    popupElements.stockLine.style.display = hasStockInfo ? 'flex' : 'none';
    popupElements.stockLine.classList.remove('is-unavailable');
    if (hasStockInfo) {
      const inStock = hasInventory(stockSource);
      popupElements.stockText.textContent = inStock ? 'In Stock' : 'Out of stock';
      popupElements.stockLine.classList.toggle('is-unavailable', !inStock);
    }

    popupElements.countControls.forEach(({
      inputShell,
      input,
      minusBtn,
      plusBtn,
    }) => {
      inputShell?.classList.toggle('is-loading', quantityDisplayState.showLoading);
      input.value = quantityDisplayState.value;
      input.readOnly = true;
      input.setAttribute('readonly', 'readonly');
      input.setAttribute('inputmode', 'none');
      input.setAttribute('aria-label', 'Quantity');
      if (quantityDisplayState.showLoading) {
        input.setAttribute('aria-busy', 'true');
      } else {
        input.removeAttribute('aria-busy');
      }
      minusBtn.disabled = popupState.processing
        || quantityDisplayState.showLoading
        || !canAdjustExistingEntry
        || quantity <= 1;
      plusBtn.disabled = popupState.processing
        || quantityDisplayState.showLoading
        || !popupState.productCode;
    });

    popupElements.deleteIcons.forEach((icon) => {
      const disabled = popupState.processing || quantityDisplayState.showLoading || !canAdjustExistingEntry;
      icon.classList.toggle('is-disabled', disabled);
      icon.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      icon.setAttribute('title', disabled
        ? 'Delete is available after this item is in the cart'
        : 'Remove item from cart');
    });

    if (popupElements.viewCartBtn) {
      popupElements.viewCartBtn.disabled = false;
      popupElements.viewCartBtn.removeAttribute('title');
    }

    if (popupElements.checkoutBtn) {
      const showCheckout = Boolean(popupState.authenticated);
      popupElements.checkoutBtn.hidden = !showCheckout;
      popupElements.checkoutBtn.disabled = !showCheckout;
      popupElements.checkoutBtn.style.display = showCheckout ? '' : 'none';
      if (showCheckout) {
        popupElements.checkoutBtn.removeAttribute('title');
      } else {
        popupElements.checkoutBtn.title = 'Proceed to checkout is available after sign in';
      }
    }
  }

  function navigateFromProductCardPopup(url) {
    if (!url) {
      return;
    }

    closeProductCardPopup();
    window.location.assign(url);
  }

  async function refreshProductCardPopupCart() {
    popupState.authenticated = Boolean(getCachedHybrisAuthState().authenticated);
    popupState.cart = await fetchHybrisCart({
      authenticated: popupState.authenticated,
      redirectOnAuthFailure: true,
      returnUrl: window.location.href,
    });
    setCachedProductCardCart(popupState.cart);
    popupState.entry = findCartEntryByProductCode(popupState.cart, popupState.productCode) || popupState.entry;
    return popupState.cart;
  }

  async function preloadProductCardCart(options = {}) {
    const { force = false } = options;
    if (!force && cartCacheState.hydrated) {
      return cartCacheState.cart;
    }

    if (!force && cartCacheState.loadPromise) {
      return cartCacheState.loadPromise;
    }

    cartCacheState.loadPromise = (async () => {
      let authenticated = Boolean(getCachedHybrisAuthState().authenticated);

      try {
        const authState = await authReadyPromise;
        authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to resolve Hybris auth state before cart preload', authError);
      }

      try {
        const cart = await fetchHybrisCart({
          authenticated,
          redirectOnAuthFailure: false,
          returnUrl: window.location.href,
        });
        return setCachedProductCardCart(cart);
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to preload product card cart', error);
        return setCachedProductCardCart(null);
      } finally {
        cartCacheState.loadPromise = null;
      }
    })();

    return cartCacheState.loadPromise;
  }

  function getPreloadedProductCardCart() {
    if (cartCacheState.loadPromise) {
      return cartCacheState.loadPromise;
    }

    return Promise.resolve(cartCacheState.cart);
  }

  async function openProductCardPopup(options = {}) {
    const existingCart = options.cart !== undefined ? options.cart : cartCacheState.cart;
    popupState.productCode = String(options.productCode || '').trim();
    popupState.authenticated = Boolean(options.authenticated);
    popupState.variant = options.variant || null;
    popupState.representative = options.representative || null;
    popupState.cart = existingCart || null;
    popupState.entry = findCartEntryByProductCode(popupState.cart, popupState.productCode)
      || getPopupEntryFallback(options.fallbackEntry, popupState.productCode);
    popupState.message = options.message || 'Add item to your cart';
    popupState.processing = false;
    setPopupQuantityLoadingState(options.pendingQuantityAction);

    renderProductCardPopup();
    setProductCardPopupVisibility(true);
  }

  async function increaseProductCardPopupQuantity() {
    if (!popupState.productCode || popupState.processing) {
      return;
    }

    const previousMessage = popupState.message;
    const previousQuantity = getCartEntryQuantity(popupState.entry);
    setPopupQuantityLoadingState('increase');
    popupState.processing = true;
    renderProductCardPopup();

    try {
      try {
        const authState = await initializeHybrisAuth();
        popupState.authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to resolve Hybris auth state before popup add to cart', authError);
      }

      await addHybrisCartItem(popupState.productCode, 1, {
        authenticated: popupState.authenticated,
        redirectOnAuthFailure: true,
        returnUrl: window.location.href,
      });
      await refreshProductCardPopupCart();
      popupState.message = previousQuantity > 0 ? 'Cart updated' : 'Item added to your cart';
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn(`Failed to increase cart quantity for ${popupState.productCode}`, error);
      popupState.message = previousMessage;
    } finally {
      popupState.processing = false;
      setPopupQuantityLoadingState('');
      renderProductCardPopup();
    }
  }

  async function decreaseProductCardPopupQuantity() {
    const entryNumber = getCartEntryNumber(popupState.entry);
    const currentQuantity = getCartEntryQuantity(popupState.entry);
    if (popupState.processing || entryNumber === null || currentQuantity <= 1) {
      return;
    }

    setPopupQuantityLoadingState('decrease');
    popupState.processing = true;
    renderProductCardPopup();

    try {
      try {
        const authState = await initializeHybrisAuth();
        popupState.authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to resolve Hybris auth state before popup cart decrease', authError);
      }

      await updateHybrisCartItem(entryNumber, currentQuantity - 1, {
        authenticated: popupState.authenticated,
        redirectOnAuthFailure: true,
        returnUrl: window.location.href,
      });
      await refreshProductCardPopupCart();
      popupState.message = 'Cart updated';
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn(`Failed to decrease cart quantity for ${popupState.productCode}`, error);
    } finally {
      popupState.processing = false;
      setPopupQuantityLoadingState('');
      renderProductCardPopup();
    }
  }

  async function removeProductCardPopupItem() {
    const entryNumber = getCartEntryNumber(popupState.entry);
    if (popupState.processing || entryNumber === null) {
      return;
    }

    setPopupQuantityLoadingState('remove');
    popupState.processing = true;
    renderProductCardPopup();

    try {
      try {
        const authState = await initializeHybrisAuth();
        popupState.authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to resolve Hybris auth state before popup cart delete', authError);
      }

      await removeHybrisCartItem(entryNumber, {
        authenticated: popupState.authenticated,
        redirectOnAuthFailure: true,
        returnUrl: window.location.href,
      });
      await refreshProductCardPopupCart();
      popupState.entry = findCartEntryByProductCode(popupState.cart, popupState.productCode) || null;
      popupState.message = 'Item removed from your cart';
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.warn(`Failed to remove cart item for ${popupState.productCode}`, error);
    } finally {
      popupState.processing = false;
      setPopupQuantityLoadingState('');
      renderProductCardPopup();
    }
  }

  function createPopupQuantityControl() {
    const countChangeEl = document.createElement('div');
    countChangeEl.className = 'count-change';

    const qtySpan = document.createElement('span');
    qtySpan.className = 'qty-span';
    qtySpan.textContent = 'Qty:';

    const btnMinus = document.createElement('button');
    btnMinus.type = 'button';
    btnMinus.className = 'qty-action qty-decrease';
    btnMinus.textContent = '-';
    btnMinus.disabled = true;

    const inputEl = document.createElement('input');
    inputEl.className = 'qty-input';
    inputEl.type = 'text';
    inputEl.value = '0';
    inputEl.readOnly = true;
    inputEl.tabIndex = -1;
    inputEl.inputMode = 'none';

    const inputShell = document.createElement('span');
    inputShell.className = 'qty-input-shell';
    inputShell.append(inputEl);

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'qty-action qty-increase';
    btnPlus.textContent = '+';

    countChangeEl.append(qtySpan, btnMinus, inputShell, btnPlus);
    return countChangeEl;
  }

  function createPopupDeleteIcon() {
    const deleteIcon = document.createElement('img');
    deleteIcon.src = `/content/dam/hisense/${country}/common-icons/delete.svg`;
    deleteIcon.className = 'delete-icon is-disabled';
    deleteIcon.alt = '';
    deleteIcon.setAttribute('aria-disabled', 'true');
    return deleteIcon;
  }

  scheduleHybrisTask(() => preloadProductCardCart()).catch((error) => {
    /* eslint-disable-next-line no-console */
    console.warn('Failed to schedule product card cart preload', error);
  });

  function applyDefaultSort() {
    // 检查是否有已选中的 filter（通过 plp-filter-tag 或选中的 input）
    const hasActiveFilters = () => {
      // 检查是否有 plp-filter-tag
      const filterTags = document.querySelectorAll('.plp-filter-tag');
      if (filterTags && filterTags.length > 0) return true;
      // 检查是否有选中的 filter input
      const checkedInputs = document.querySelectorAll('.plp-filter-item input[data-option-value]:checked');
      return (checkedInputs && checkedInputs.length > 0) || isPriceFilterActive();
    };

    const sortAndApplyFilters = () => {
      const selectedSortOption = document.querySelector('.plp-sort-option.selected');
      if (selectedSortOption) {
        const sortValue = selectedSortOption.dataset.value
            || selectedSortOption.getAttribute('data-value')
            || '';
        if (sortValue && sortValue.trim()) {
          if (window.applyPlpSort) {
            window.applyPlpSort(sortValue);
          } else {
            applyAggregatedSort('size', -1);
          }
        } else {
          applyAggregatedSort('size', -1);
        }
      } else {
        applyAggregatedSort('size', -1);
      }
    };

    if (hasActiveFilters()) {
      // 如果有已选中的 filter，先应用筛选（筛选内部会处理排序）
      if (window.applyPlpFilters) {
        window.applyPlpFilters();
      } else {
        sortAndApplyFilters();
      }
    } else {
      // 没有筛选条件，直接排序
      sortAndApplyFilters();
    }
  }

  function applyUrlFilters() {
    try {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search);

      // 遍历所有URL参数
      urlParams.forEach((paramValue, paramName) => {
        if (paramValue) {
          // 直接使用参数名和值组合成筛选条目
          const targetValue = `${paramName}/${paramValue}`;
          const targetCheckbox = document.querySelector(`.plp-filter-item input[value$="${targetValue}"]`);
          // const targetCheckbox = document.querySelector(`.product-filter-item[data-tag="${targetValue}"]`);

          if (targetCheckbox) {
            // 触发checkbox的点击事件
            targetCheckbox.click();

            // 展开对应的筛选组
            const filterGroup = targetCheckbox.closest('.plp-filter-group');
            if (filterGroup && filterGroup.classList.contains('hide')) {
              filterGroup.classList.remove('hide');
            }
          }
        }
      });
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('URL filter error:', e);
    }
  }

  // 新增：更新Load More按钮显示状态
  function updateLoadMoreVisibility() {
    const totalPages = Math.ceil(allGroupedData.length / loadMoreStep);
    if (currentPage >= totalPages) {
      productsLoadMore.style.display = 'none';
    } else {
      productsLoadMore.style.display = 'block';
    }
  }

  // 新增：渲染分页后的产品
  function renderPagedItems() {
    const start = (currentPage - 1) * loadMoreStep;
    const end = start + loadMoreStep;
    const pagedGroupedArray = allGroupedData.slice(start, end);

    // 处理所有产品数据的 productDetailPageLink
    pagedGroupedArray.forEach((group) => {
      const item = group.representative;
      if (item.productDetailPageLink && typeof item.productDetailPageLink === 'string') {
        const { hostname, pathname } = window.location;
        if (hostname.includes('hisense.com') && pathname.startsWith('/us')) {
          item.productDetailPageLink = item.productDetailPageLink.replace('/us/en', '/us');
        }
      }
    });

    // 渲染当前页的产品卡片（追加模式）
    pagedGroupedArray.forEach((group) => {
      const item = group.representative;
      const card = document.createElement('div');
      card.className = 'product-card';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'product-card-title';
      const productCardTag = document.createElement('div');
      productCardTag.className = 'product-card-tag';
      titleDiv.append(productCardTag);

      const fav = document.createElement('div');
      fav.className = 'plp-favorite plp-favorite-pending';
      setControlLoadingState(fav, false);
      const likeEmpty = document.createElement('img');
      likeEmpty.className = 'plp-like-empty';
      likeEmpty.src = `/content/dam/hisense/${country}/common-icons/like-empty.svg`;
      fav.appendChild(likeEmpty);
      const like = document.createElement('img');
      like.className = 'plp-like';
      like.src = `/content/dam/hisense/${country}/common-icons/like.svg`;
      fav.appendChild(like);
      titleDiv.append(fav);

      const imgDiv = document.createElement('div');
      imgDiv.className = 'plp-product-img';
      const imgPath = (() => {
        // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
        if (window.useShortDescriptionAsImage) {
          return extractImageFromShortDescription(item);
        }
        // 否则走默认逻辑
        if (!item || !item.mediaGallery_image) return null;
        const pKey = Object.keys(item.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
        return pKey ? item.mediaGallery_image[pKey] : null;
      })();
      if (imgPath) {
        const img = document.createElement('img');
        img.src = imgPath;
        imgDiv.appendChild(img);
      }

      const seriesDiv = document.createElement('div');
      seriesDiv.className = 'plp-product-series';
      if (fields.includes('series') && item.series) seriesDiv.textContent = item.series;

      const nameDiv = document.createElement('div');
      nameDiv.className = 'plp-product-name';
      if (fields.includes('title')) {
        const metaTitle = (() => {
          if (!item) return null;
          const metaKey = Object.keys(item).find((k) => k.toLowerCase().includes('metadata'));
          const meta = metaKey ? item[metaKey] : null;
          if (meta && Array.isArray(meta.stringMetadata)) {
            const found = meta.stringMetadata.find((x) => x.name === 'title');
            return found ? found.value : null;
          }
          return null;
        })();
        const fullTitle = item.title || metaTitle || group.factoryModel || '';
        nameDiv.textContent = fullTitle;
        // 添加完整的title作为tooltip
        nameDiv.title = fullTitle;
      }

      const extraFields = document.createElement('div');
      extraFields.className = 'plp-product-extra';
      fields.forEach((f) => {
        if (['title', 'series', 'mediaGallery_image'].includes(f)) return;
        const keyParts = f.includes('.') ? f.split('.') : f.split('_');
        const value = keyParts.reduce(
          (acc, k) => (acc && acc[k] !== undefined ? acc[k] : null),
          item,
        );
        if (value !== null && value !== undefined) {
          const fld = document.createElement('div');
          const safeClass = `plp-product-field-${f.replace(/[^a-z0-9_-]/gi, '')}`;
          fld.className = `plp-product-field ${safeClass}`;
          fld.textContent = value;
          extraFields.appendChild(fld);
        }
      });

      const priceGroupDiv = document.createElement('div');
      priceGroupDiv.className = 'plp-product-price-group';
      priceGroupDiv.style.display = 'none';
      const currentPriceEl = document.createElement('h5');
      currentPriceEl.className = 'plp-product-current-price';
      const currentPriceCurrency = document.createElement('span');
      const currentPriceValue = document.createElement('span');
      currentPriceEl.append(currentPriceCurrency, currentPriceValue);
      const originalPriceEl = document.createElement('div');
      originalPriceEl.className = 'plp-product-original-price';
      const originalPriceCurrency = document.createElement('span');
      const originalPriceValue = document.createElement('span');
      originalPriceEl.append(originalPriceCurrency, originalPriceValue);

      const discountsDiv = document.createElement('div');
      discountsDiv.className = 'plp-product-discounts';
      const discountsTitle = document.createElement('span');
      discountsTitle.textContent = 'Save';
      const discountsCurrency = document.createElement('span');
      const discountsValue = document.createElement('span');
      discountsDiv.append(discountsTitle, discountsCurrency, discountsValue);
      priceGroupDiv.append(currentPriceEl, originalPriceEl, discountsDiv);

      // color 区块（可点击，默认选中第一个尺寸，切换显示对应 variant 信息
      const colorsDiv = document.createElement('div');
      colorsDiv.className = 'plp-product-colors';

      const colorToVariant = new Map();
      group.variants.forEach((v) => {
        const s = v.colorRGB;
        if (!colorToVariant.has(s)) colorToVariant.set(s, v);
      });

      // sizes 区块（可点击，默认选中第一个尺寸，切换显示对应 variant 信息
      const sizesDiv = document.createElement('div');
      sizesDiv.className = 'plp-product-sizes';

      // 构建 size -> variant 的映射
      const sizeToVariant = new Map();
      group.variants.forEach((v) => {
        // eslint-disable-next-line no-use-before-define
        const s = extractSize(v);
        if (s && !sizeToVariant.has(s)) sizeToVariant.set(s, v);
      });
      const sizesArray = (Array.isArray(group.sizes) && group.sizes.length)
        ? group.sizes
        : Array.from(sizeToVariant.keys()).filter(Boolean);
      const hasSizeValue = sizesArray.length > 0;
      // 如果用了默认排序，默认选中最大尺寸，其他排序选中第一个尺寸
      let [selectedSize] = sizesArray;
      let selectedVariant = selectedSize ? (sizeToVariant.get(selectedSize) || item) : item;

      // create product button group
      const productBtnGroupEl = document.createElement('div');
      productBtnGroupEl.className = 'plp-product-btn-group';
      // where to by
      const addToCartBtnEl = document.createElement('div');
      addToCartBtnEl.className = 'plp-add-to-cart-btn plp-purchase-hidden';
      addToCartBtnEl.textContent = 'Add to Cart';

      const whereToBuyBtnEl = document.createElement('div');
      whereToBuyBtnEl.className = 'plp-where-to-buy-btn ps-widget plp-purchase-hidden';

      // create compare
      const compareEl = document.createElement('div');
      compareEl.className = 'plp-product-compare';
      const compareIcon = document.createElement('span');
      compareIcon.className = 'plp-product-compare-icon';
      compareIcon.innerHTML = `<img class="icon-unchecked" src="/content/dam/hisense/${country}/common-icons/icon-carousel/checkbox-empty.svg" alt="" />
        <img class="icon-checked" src="/content/dam/hisense/${country}/common-icons/icon-carousel/checkbox.svg" alt="" />`;
      const labelSpan = document.createElement('span');
      labelSpan.textContent = 'Compare';
      compareEl.append(compareIcon, labelSpan);

      const colorsArray = (Array.isArray(group.colors) && group.colors.length)
        ? group.colors
        : Array.from(colorToVariant.keys());
      const hasColorValue = colorsArray.some((x) => x && x !== undefined);
      const shouldUseColorSelection = !hasSizeValue && hasColorValue && colorsArray.length > 0;
      // 如果用了默认排序，默认选中最大尺寸，其他排序选中第一个尺寸
      let [selectedColor] = colorsArray;
      if (shouldUseColorSelection) {
        selectedVariant = selectedColor ? (colorToVariant.get(selectedColor) || item) : selectedVariant;
      }
      const shouldShowPrice = true;
      let commerceRequestId = 0;
      let wishlistStateReady = false;
      let favoriteEnabled = false;
      let favoriteAuthenticated = Boolean(getCachedHybrisAuthState().authenticated);

      const getVariantProductCode = (variant) => getHybrisProductCode(variant)
        || getHybrisProductCode(item)
        || getHybrisProductCode(group.representative);

      const updateFavoriteState = (productCode) => {
        const canShowFavorite = Boolean(productCode) && shouldShowPlpFavoriteButton({
          authenticated: favoriteAuthenticated,
          hasInventory: favoriteEnabled,
        });
        fav.dataset.productCode = productCode || '';
        fav.hidden = !canShowFavorite;
        fav.classList.toggle(
          'selected',
          canShowFavorite && Boolean(getWishlistEntryByProductCode(fav.dataset.productCode)),
        );
        fav.classList.toggle('plp-favorite-pending', canShowFavorite && !wishlistStateReady);
      };

      const refreshFavoriteState = async (productCode, requestId) => {
        wishlistStateReady = false;
        updateFavoriteState(productCode);

        try {
          const authState = await authReadyPromise;
          favoriteAuthenticated = Boolean(authState?.authenticated);
          if (favoriteAuthenticated) {
            await ensureWishlistLoaded();
          }
        } catch (error) {
          /* eslint-disable-next-line no-console */
          console.warn(`Failed to load wishlist state for ${productCode}`, error);
        } finally {
          wishlistStateReady = true;
          if ((requestId === undefined || requestId === commerceRequestId) && fav.dataset.productCode === productCode) {
            updateFavoriteState(productCode);
          }
        }
      };

      const setPurchaseButtonVisibility = (button, visible) => {
        button.classList.toggle('plp-purchase-hidden', !visible);
        button.style.display = visible ? 'block' : 'none';
      };

      const hidePurchaseButtons = () => {
        setPurchaseButtonVisibility(addToCartBtnEl, false);
        setPurchaseButtonVisibility(whereToBuyBtnEl, false);
      };

      const updatePurchaseButtons = (showAddToCart) => {
        const addToCartCode = addToCartBtnEl.dataset.productCode || '';
        if (!addToCartCode) {
          hidePurchaseButtons();
          return;
        }

        const canShowAddToCart = Boolean(showAddToCart);
        setPurchaseButtonVisibility(addToCartBtnEl, canShowAddToCart);
        setPurchaseButtonVisibility(whereToBuyBtnEl, !canShowAddToCart);
      };

      const updatePriceState = (commerceProduct, fallbackSource = null) => {
        if (!shouldShowPrice || !commerceProduct) {
          priceGroupDiv.style.display = 'none';
          currentPriceCurrency.textContent = '';
          currentPriceValue.textContent = '';
          originalPriceCurrency.textContent = '';
          originalPriceValue.textContent = '';
          discountsCurrency.textContent = '';
          discountsValue.textContent = '';
          originalPriceEl.style.display = 'none';
          discountsDiv.style.display = 'none';
          return false;
        }

        const { sale, msrp, currency } = getPricingDetails(commerceProduct, fallbackSource);
        const primaryPrice = (sale.formattedValue || sale.value !== null) ? sale : msrp;
        const currentPriceParts = getPriceParts(primaryPrice, currency);
        const originalPriceParts = getPriceParts(msrp, currency);
        const hasDiscount = sale.value !== null && msrp.value !== null && msrp.value > sale.value;
        const discountParts = hasDiscount
          ? getPriceParts({
            value: msrp.value - sale.value,
            currencyIso: currency,
          }, currency)
          : { currency: '', amount: '', full: '' };

        currentPriceCurrency.textContent = currentPriceParts.currency || '';
        currentPriceValue.textContent = currentPriceParts.amount || currentPriceParts.full || '';
        originalPriceCurrency.textContent = hasDiscount ? (originalPriceParts.currency || '') : '';
        originalPriceValue.textContent = hasDiscount ? (originalPriceParts.amount || originalPriceParts.full || '') : '';
        discountsCurrency.textContent = hasDiscount ? (discountParts.currency || '') : '';
        discountsValue.textContent = hasDiscount ? (discountParts.amount || discountParts.full || '') : '';

        originalPriceEl.style.display = hasDiscount ? '' : 'none';
        discountsDiv.style.display = hasDiscount ? '' : 'none';
        priceGroupDiv.style.display = currentPriceParts.full ? 'flex' : 'none';
        return Boolean(currentPriceParts.full);
      };

      const refreshCommerceState = async (variant) => {
        const requestId = commerceRequestId + 1;
        commerceRequestId = requestId;

        const productCode = getVariantProductCode(variant);
        favoriteEnabled = false;
        updateFavoriteState(productCode);
        hidePurchaseButtons();
        updatePriceState(null, variant);

        if (!productCode) {
          return;
        }

        refreshFavoriteState(productCode, requestId);

        try {
          const commerceProduct = await fetchHybrisProduct(productCode);
          if (requestId !== commerceRequestId || fav.dataset.productCode !== productCode) {
            return;
          }

          const inventoryAvailable = hasInventory(commerceProduct);
          const hasPrice = updatePriceState(commerceProduct, variant);
          favoriteEnabled = inventoryAvailable;
          updatePurchaseButtons(shouldShowAddToCartButton({
            hasPrice,
            hasInventory: inventoryAvailable,
          }));
          updateFavoriteState(productCode);
        } catch (error) {
          /* eslint-disable-next-line no-console */
          console.warn(`Failed to load commerce data for ${productCode}`, error);
          if (requestId !== commerceRequestId) {
            return;
          }
          favoriteEnabled = false;
          updatePriceState(null, variant);
          updatePurchaseButtons(false);
          updateFavoriteState(productCode);
        }
      };

      fav.addEventListener('click', async (event) => {
        event.stopPropagation();

        const favoriteEl = event.currentTarget;
        const productCode = favoriteEl.dataset.productCode || getVariantProductCode(selectedVariant);
        if (!productCode || favoriteEl.dataset.loading === 'true') {
          return;
        }

        let deferLoadingReset = false;
        setControlLoadingState(favoriteEl, true);
        try {
          const authState = await authReadyPromise;
          if (!authState.authenticated) {
            deferLoadingReset = true;
            scheduleControlLoadingReset(favoriteEl);
            startHybrisLogin(window.location.href);
            return;
          }

          const existingEntry = getWishlistEntryByProductCode(productCode);
          if (existingEntry?.entryNumber !== undefined && existingEntry?.entryNumber !== null) {
            bumpWishlistVersion();
            await removeHybrisWishlistItem(existingEntry.entryNumber, {
              cartCode: existingEntry.cartCode || wishlistPrimaryCartCode,
              redirectOnAuthFailure: true,
              returnUrl: window.location.href,
            });
            deleteWishlistEntry(existingEntry, productCode);
            wishlistLoaded = true;
            syncWishlistFavoriteElements();
          } else {
            let targetCartCode = existingEntry?.cartCode || wishlistPrimaryCartCode;
            if (!targetCartCode) {
              await ensureWishlistLoaded(true).catch(() => wishlistEntriesByCode);
              targetCartCode = getWishlistEntryByProductCode(productCode)?.cartCode || wishlistPrimaryCartCode;
            }
            if (!targetCartCode) {
              throw new Error('Wishlist cartCode is unavailable');
            }

            bumpWishlistVersion();
            const addResponse = await addHybrisWishlistItem(productCode, 1, {
              cartCode: targetCartCode,
              redirectOnAuthFailure: true,
              returnUrl: window.location.href,
            });
            if (!targetCartCode) {
              await ensureWishlistLoaded(true).catch(() => wishlistEntriesByCode);
              targetCartCode = getWishlistEntryByProductCode(productCode)?.cartCode || wishlistPrimaryCartCode;
            }
            const nextEntry = getWishlistEntryData(addResponse, productCode, targetCartCode);
            if (nextEntry?.code) {
              setWishlistEntry(nextEntry, productCode, addResponse, addResponse?.product, addResponse?.item, addResponse?.entry);
              wishlistLoaded = true;
              syncWishlistFavoriteElements();
            } else {
              setWishlistEntry({
                code: productCode,
                entryNumber: null,
                cartCode: targetCartCode,
              }, productCode);
              wishlistLoaded = true;
              syncWishlistFavoriteElements();
              ensureWishlistLoaded(true).catch(() => wishlistEntriesByCode);
            }
          }
        } catch (error) {
          /* eslint-disable-next-line no-console */
          console.warn(`Failed to toggle wishlist item for ${productCode}`, error);
          await ensureWishlistLoaded(true).catch(() => wishlistEntriesByCode);
        } finally {
          if (!deferLoadingReset) {
            setControlLoadingState(favoriteEl, false);
          }
        }

        await refreshFavoriteState(productCode);
      });

      addToCartBtnEl.addEventListener('click', async (event) => {
        event.stopPropagation();

        const addToCartTarget = event.currentTarget;
        const productCode = addToCartTarget.dataset.productCode || getVariantProductCode(selectedVariant);
        if (!productCode || addToCartTarget.dataset.loading === 'true') {
          return;
        }

        setControlLoadingState(addToCartTarget, true);

        try {
          const cachedCart = await getPreloadedProductCardCart().catch(() => null);
          await openProductCardPopup({
            productCode,
            authenticated: Boolean(getCachedHybrisAuthState().authenticated),
            variant: selectedVariant,
            representative: group.representative,
            cart: cachedCart,
            message: 'Add item to your cart',
            pendingQuantityAction: 'increase',
          });
          await increaseProductCardPopupQuantity();
        } catch (popupError) {
          /* eslint-disable-next-line no-console */
          console.warn(`Failed to open cart popup for ${productCode}`, popupError);
        } finally {
          setControlLoadingState(addToCartTarget, false);
        }
      });

      // 用来更新卡片显示为指定变体
      const updateCardWithVariant = (variant) => {
        productCardTag.textContent = resolveProductCardTagLabel(variant);

        // image
        const variantImg = getVariantImageUrl(variant);

        const updateImg = imgDiv.querySelector('img');
        if (variantImg && updateImg) {
          updateImg.src = variantImg;
        } else if (updateImg) {
          updateImg.src = '';
        }
        // series
        if (fields.includes('series') && variant.series) seriesDiv.textContent = variant.series;
        // title/name
        if (fields.includes('title')) {
          nameDiv.textContent = getProductDisplayTitle(variant, group.factoryModel || '');
        }
        // extra fields
        extraFields.innerHTML = '';
        fields.forEach((f) => {
          if (['title', 'series', 'mediaGallery_image'].includes(f)) return;
          const keyParts = f.includes('.') ? f.split('.') : f.split('_');
          const value = keyParts.reduce(
            (acc, k) => (acc && acc[k] !== undefined ? acc[k] : null),
            variant,
          );
          if (value !== null && value !== undefined) {
            const fld = document.createElement('div');
            const safeClass = `plp-product-field-${f.replace(/[^a-z0-9_-]/gi, '')}`;
            fld.className = `plp-product-field ${safeClass}`;
            fld.textContent = value;
            extraFields.appendChild(fld);
          }
        });

        // 为 add to cart 按钮设置商品对应属性
        const variantProductCode = getVariantProductCode(variant);
        addToCartBtnEl.dataset.productCode = variantProductCode || '';
        fav.dataset.productCode = variantProductCode || '';
        addToCartBtnEl.textContent = 'Add to Cart';
        setControlLoadingState(addToCartBtnEl, false);
        setControlLoadingState(fav, false);
        if (wishlistLoaded) {
          syncWishlistFavoriteElements();
        }

        // 为 where to buy 按钮设置商品对应属性
        whereToBuyBtnEl.setAttribute('ps-button-label', 'where to buy');
        whereToBuyBtnEl.setAttribute('ps-sku', variantProductCode || '');

        // productDetailPageLink - 先检查当前产品尺寸是否有productDetailPageLink链接，如果没有，才使用共享链接
        const productDetailPageLink = variant.productDetailPageLink || group.sharedProductDetailPageLink || '#';
        if (productDetailPageLink && productDetailPageLink !== '#') {
          let link = card.querySelector && card.querySelector('.plp-product-btn');
          if (!link) {
            link = document.createElement('a');
            link.className = 'plp-product-btn';
            link.target = '_blank';
            // card.append(link);
            productBtnGroupEl.append(link);
          }
          link.href = productDetailPageLink;
          link.textContent = 'Learn more';
        } else {
          const existingLink = card.querySelector && card.querySelector('.plp-product-btn');
          if (existingLink) existingLink.remove();
        }

        // 为比较数据准备对应的属性值
        // 1、为商品卡片中的【Compare】按钮设置 id 属性
        compareEl.setAttribute('data-compare-id', variant.sku || group.sku || '');

        // 2、为商品卡片中的【Compare】按钮设置当前选中的属性（如： size 或 color）
        let curSelectedProperty = selectedSize || variant.size || group.size || '';
        // 只有在没有 size 时，才回退使用 color
        if (shouldUseColorSelection) {
          curSelectedProperty = selectedColor || variant.colorRGB || group.colorRGB || '';
        }
        compareEl.setAttribute('data-selected-property', curSelectedProperty);

        // 3、为商品卡片 product-card 父元素设置 id 属性，方便当size 修改时，在比较商品数据源中拿到对应数据进行移除
        compareEl.closest('.product-card').setAttribute('data-compare-id', variant.sku || group.sku || '');

        scheduleHybrisTask(() => refreshCommerceState(variant)).catch((error) => {
          /* eslint-disable-next-line no-console */
          console.warn('Failed to refresh commerce state', error);
        });
        rebindPriceSpiderWidgets();
      };

      // 创建尺寸节点并绑定事件
      sizesArray.forEach((s) => {
        const sp = document.createElement('span');
        sp.className = 'plp-product-size';
        sp.textContent = s;
        if (s === selectedSize) sp.classList.add('selected');
        sp.addEventListener('click', () => {
          if (selectedSize === s) return;
          // 更新选中样式
          const prev = sizesDiv.querySelector('.plp-product-size.selected');
          if (prev) prev.classList.remove('selected');
          sp.classList.add('selected');
          selectedSize = s;
          selectedVariant = sizeToVariant.get(s) || item;

          // size 切换时，需要清空对应的比较数据
          changeCardSelectedProperty(sp);

          updateCardWithVariant(selectedVariant);
        });
        sizesDiv.appendChild(sp);
      });

      // 为商品card 中的 【Compare】按钮添加点击事件
      compareEl.addEventListener('click', (compareE) => {
        compareE.stopPropagation();
        // 最多只能比较3个产品
        if (compareDataArr.length > 2 && !compareEl.classList.contains('compare-checked')) {
          return;
        }
        // card 中的 【Compare】 btn 是否添加 选中类
        compareEl.classList.toggle('compare-checked');
        // 当前商品选中属性
        const curCardSelectedProperty = compareE.currentTarget.getAttribute('data-selected-property') ?? '';
        // 当前商品选中属性，对应的数据源（也是比较商品的数据来源）
        let cardSelectedVariant = sizeToVariant.get(curCardSelectedProperty) || selectedVariant || item;
        // 只有在没有 size 时，才回退使用 color
        if (shouldUseColorSelection) {
          cardSelectedVariant = colorToVariant.get(curCardSelectedProperty) || selectedVariant || item;
        }

        const isAdded = compareEl.classList.contains('compare-checked');
        if (isAdded) {
          // 1、新增比较数据
          compareDataArr.push(cardSelectedVariant);
          const compareBarAllLi = document.querySelectorAll('.plp-compare-card-item');
          // 2、选择1个产品时，就展示页面询问固定栏，但compare按钮不可点击；选择2-3个产品时，compare按钮可点击
          if (compareDataArr.length && compareDataArr.length === 1) {
            document.querySelector('.plp-compare-bar').classList.add('compare-bar-show');
            document.querySelector('.plp-compare-btn').classList.add('compare-disabled');
            // 底部 compare bar 出现时且为移动端时，为footer 添加 padding-bottom
            if (isMobileWindow()) {
              const footerWrapper = document.querySelector('.footer-wrapper');
              footerWrapper.style.paddingBottom = `${(274 / 390) * window.innerWidth}px`;
            }
          } else {
            document.querySelector('.plp-compare-btn').classList.remove('compare-disabled');
          }

          // 3、为底部固定栏中的对应li 设置已选择产品的图片、产品名称
          compareBarAllLi.forEach((curLi, index) => {
            if (index === compareDataArr.length - 1) {
              setCompareProductImgTit(curLi, cardSelectedVariant);
            }
          });

          // 4、为底部固定比较栏中的对应商品的删除按钮添加点击事件
          const comparBarUlEl = document.querySelector('.plp-compare-cards');
          comparBarUlEl.addEventListener('click', (e) => {
            const { target } = e;
            // 只处理点击元素是删除按钮
            if (!target.parentNode.classList.contains('plp-compare-card-close')) return;
            // 获取按钮所在的 li (parentNode 因为按钮直接放在li内)
            const parentLi = target.closest('.plp-compare-card-item');
            if (!parentLi) return;
            // 获取 li 上存储的产品 id
            const delCompareId = parentLi.dataset.compareId;
            if (!delCompareId) return;
            // filter 数据源
            compareDataArr = compareDataArr.filter((v) => v.sku !== delCompareId);
            // 移除比较数据dom集合中的对应 li
            removeCompareLiUtil(delCompareId);
            // 取消产品 card 中 【Compare】 button 选中态
            const cardCompareBtnAll = document.querySelectorAll('.compare-checked');
            cardCompareBtnAll.forEach((compareBtnItem) => {
              if (compareBtnItem.dataset.compareId === delCompareId) {
                compareBtnItem.classList.remove('compare-checked');
              }
            });
            // 隐藏底部固定比较栏
            hideCompareBar();
          });
        } else {
          // 取消商品 card 【Compare】按钮的选中态，重新过滤比较数据集合
          compareDataArr = compareDataArr.filter((v) => v.sku !== cardSelectedVariant.sku);
          // 移除比较数据集合中的对应 li
          removeCompareLiUtil(cardSelectedVariant.sku);
          // 隐藏底部固定比较栏
          hideCompareBar();
        }
      });

      // 创建color节点并绑定事件
      colorsArray?.forEach((s) => {
        const sp = document.createElement('span');
        sp.classList.add('plp-product-color');
        sp.style.backgroundColor = s;
        if (s && (s.toLowerCase() === '#fff'
        || s.toLowerCase() === '#ffffff'
        || s.toLowerCase() === 'white'
        || s.toLowerCase() === 'rgb(255, 255, 255)')) {
          sp.style.border = '1px solid #cfcfcf';
        }
        if (s === selectedColor) sp.classList.add('selected');
        sp.addEventListener('click', () => {
          if (selectedColor === s) return;
          // 更新选中样式
          const prev = colorsDiv.querySelector('.plp-product-color.selected');
          if (prev) prev.classList.remove('selected');
          sp.classList.add('selected');
          selectedColor = s;
          selectedVariant = colorToVariant.get(s) || item;
          // color 属性 change 时，需要清空对应的比较数据
          changeCardSelectedProperty(sp);
          updateCardWithVariant(selectedVariant);
        });
        colorsDiv.appendChild(sp);
      });
      // 如果 size 和 color 同时存在，优先显示 size
      let showDiv = null;
      if (hasSizeValue) {
        showDiv = sizesDiv;
      } else if (shouldUseColorSelection) {
        showDiv = colorsDiv;
      }
      // card.append(titleDiv, imgDiv, seriesDiv, nameDiv, showDiv, extraFields);

      // 将where to buy 按钮追加在按钮组dom 中
      productBtnGroupEl.prepend(whereToBuyBtnEl);
      productBtnGroupEl.prepend(addToCartBtnEl);

      card.append(titleDiv, imgDiv, seriesDiv, nameDiv);
      if (showDiv) {
        card.append(showDiv);
      }
      card.append(priceGroupDiv, extraFields, productBtnGroupEl, compareEl);
      productsGrid.append(card);

      updateCardWithVariant(selectedVariant);
    });

    // 更新结果计数，显示聚合后的产品卡数量
    try {
      const resultsEl = document.querySelector('.plp-results');
      if (resultsEl) {
        const visible = resultsEl.querySelector('.plp-results-count-visible');
        const hidden = resultsEl.querySelector('.plp-results-count');
        const count = allGroupedData.length;
        if (visible) {
          visible.textContent = String(count);
        }
        if (hidden) {
          hidden.textContent = String(count);
        }
        if (!visible && !hidden) {
          const currentText = resultsEl.textContent || '';
          const updatedText = currentText.replace(/\{[^}]*\}/, String(count));
          resultsEl.textContent = updatedText;
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }

    // 当结果为0时显示no result
    try {
      const noResultEl = document.querySelector('.plp-products-no-result');
      const cardWrapperEl = document.querySelector('.product-card-wrapper');
      if (noResultEl) {
        if (allGroupedData.length === 0) {
          noResultEl.style.display = 'flex';
          productsGrid.style.display = 'none';
          cardWrapperEl.style.cssText = 'margin: auto !important;';
        } else {
          noResultEl.style.display = 'none';
          productsGrid.style.display = 'grid';
          cardWrapperEl.style.cssText = '';
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }
  }

  // 包含多个相同 factoryModel 的不同尺寸
  const extractSize = (item) => {
    if (!item) return null;
    if (item.size) return String(item.size).replace(/["\s]/g, '');
    return null;
  };

  function renderItems(items) {
    // 重置分页状态
    currentPage = 1;
    productsGrid.innerHTML = ''; // 清空现有内容

    // 处理所有产品数据的 productDetailPageLink
    items.forEach((item) => {
      if (item.productDetailPageLink && typeof item.productDetailPageLink === 'string') {
        const { hostname, pathname } = window.location;
        if (hostname.includes('hisense.com') && pathname.startsWith('/us')) {
          item.productDetailPageLink = item.productDetailPageLink.replace('/us/en', '/us');
        }
      }
      if (!Array.isArray(item.tags)) {
        item.tags = [];
      }
      // 显示colorName时，确保color属性都不能为空
      if (item.colorName != null && item.color == null) {
        item.color = item.colorName;
      }
      // 补全ConnectLife Enabled没有配置的情况
      const TAG_YES = 'hisense:product/tv/connectlife-enabled/yes';
      const TAG_NO = 'hisense:product/tv/connectlife-enabled/no';
      const hasYesTag = item.tags.includes(TAG_YES);
      const hasNoTag = item.tags.includes(TAG_NO);

      // 如果两个标签都不包含，就插入NO标签
      if (!hasYesTag && !hasNoTag) {
        item.tags.push(TAG_NO);
      }
    });

    // 按 factoryModel 聚合
    const groups = {};
    items.forEach((it) => {
      const key = it.factoryModel || it.spu || it.overseasModel;
      if (!groups[key]) {
        groups[key] = {
          factoryModel: it.factoryModel || null,
          representative: it,
          variants: [],
          sizes: new Set(),
          colors: new Set(),
        };
      }
      groups[key].variants.push(it);
      // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
      if (window.useShortDescriptionAsImage) {
        if (!groups[key].representative.description_shortDescription
            && it.description_shortDescription) {
          groups[key].representative = it;
        }
      } else if (!groups[key].representative.mediaGallery_image && it.mediaGallery_image) {
        // 否则走默认逻辑
        groups[key].representative = it;
      }
      const sz = extractSize(it);
      if (sz) groups[key].sizes.add(sz);
      const color = it?.colorRGB;
      if (color) groups[key].colors.add(color);
    });

    allGroupedData = Object.keys(groups).map((k) => {
      const g = groups[k];
      const sizes = Array.from(g.sizes).filter(Boolean).sort((a, b) => Number(b) - Number(a));
      const colors = Array.from(g.colors).filter(Boolean);
      // 检查聚合产品是否有任意size有productDetailPageLink，有就共享这个链接
      let sharedProductDetailPageLink = g.variants.find((variant) => variant && variant.productDetailPageLink)?.productDetailPageLink;

      if (sharedProductDetailPageLink && sharedProductDetailPageLink.startsWith('/')) {
        const currentUri = window.location.href;
        const hasContentHisense = currentUri.includes('/content/hisense');
        const wtbHasContentHisense = sharedProductDetailPageLink.includes('/content/hisense');

        if (hasContentHisense && !wtbHasContentHisense) {
          sharedProductDetailPageLink = `/content/hisense${sharedProductDetailPageLink}`;
        } else if (!hasContentHisense && wtbHasContentHisense) {
          sharedProductDetailPageLink = sharedProductDetailPageLink.replace('/content/hisense', '');
        }
        sharedProductDetailPageLink = sharedProductDetailPageLink.replace('.html', '');
      }

      return {
        key: k,
        factoryModel: g.factoryModel,
        representative: g.representative,
        variants: g.variants,
        sizes,
        sharedProductDetailPageLink,
        colors,
      };
    });

    productsGrid.setAttribute('data-group-length', allGroupedData.length);

    // 渲染第一页
    renderPagedItems();
    rebindPriceSpiderWidgets();
    // 更新Load More显示状态
    updateLoadMoreVisibility();
  }

  const mockData = {};

  function simpleHash(str) {
    const s = String(str);
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
      h = (h * 31 + s.charCodeAt(i)) % 2147483647;
    }
    return Math.abs(h).toString(36);
  }

  /**
   * Get GraphQL endpoint URL with base URL
   */
  function getGraphQLUrl(endpointPath) {
    let path = localizeProductApiPath(endpointPath);
    const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
    const isAemEnv = hostname.includes('author') || hostname.includes('publish');

    if (isAemEnv && path && path.endsWith('.json')) {
      let pathWithoutJson = path.replace(/\.json$/, '');
      pathWithoutJson = pathWithoutJson.replace(/^\/product\/?/, '/') || '/';
      path = `/bin/hisense/productList.json?path=${pathWithoutJson}`;
    }

    const baseUrl = window.GRAPHQL_BASE_URL || '';
    let url;
    if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
      url = path;
    } else {
      url = baseUrl ? `${baseUrl}${path}` : path;
    }
    const fiveMinutesMs = 5 * 60 * 1000;
    const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
    const sep = url.indexOf('?') >= 0 ? '&' : '?';
    return `${url}${sep}_t=${cacheBuster}`;
  }

  /**
   * 新的 GraphQL 返回结构转换为现有可用的结构
   */
  function transformTagStructureToProducts(tagData) {
    if (!tagData) return [];

    if (Array.isArray(tagData)) {
      return tagData;
    }

    if (tagData.data && Array.isArray(tagData.data)) {
      return tagData.data;
    }

    if (tagData.data && tagData.data.productModelList && Array.isArray(tagData.data.productModelList.items)) {
      return tagData.data.productModelList.items;
    }

    return [];
  }

  fetch(getGraphQLUrl(graphqlUrl))
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      // 转换新的标签结构为产品列表格式
      const items = transformTagStructureToProducts(data);
      // 缓存到全局，供过滤器使用
      window.productData = items;
      notifyPlpProductsReady(items);
      if (window.renderPlpProducts) {
        window.renderPlpProducts(items);
      } else {
        renderItems(items);
      }
      // 页面初始化查询用默认排序
      applyDefaultSort();
      // 检查URL参数并应用筛选
      applyUrlFilters();
      // 初始化询问比较固定栏
      fixedBottomCompareBar();
    })
    .catch(() => {
      const items = (mockData && mockData.data) || [];
      window.productData = items;
      notifyPlpProductsReady(items);
      if (window.renderPlpProducts) {
        window.renderPlpProducts(items);
      } else {
        renderItems(items);
      }
      // 页面初始化查询用默认排序
      applyDefaultSort();
      // 检查URL参数并应用筛选
      applyUrlFilters();
      // 初始化询问比较固定栏
      fixedBottomCompareBar();
    });
  /* eslint-disable-next-line no-underscore-dangle */
  window.renderItems = renderItems;

  document.querySelector('#product-card-popup')?.remove();
  document.querySelector('#product-card-mask')?.remove();

  const popup = document.createElement('div');
  popup.id = 'product-card-popup';
  const closeImg = document.createElement('img');
  closeImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
  closeImg.className = 'close-icon';
  closeImg.alt = 'Close';
  closeImg.addEventListener('click', closeProductCardPopup);
  popup.append(closeImg);

  const popupTitle = document.createElement('div');
  popupTitle.className = 'popup-title';
  popupTitle.textContent = 'Item added to your cart';

  const popupList = document.createElement('div');
  popupList.className = 'popup-list';
  const img = document.createElement('img');
  img.className = 'popup-product-image';

  const popupInfo = document.createElement('div');
  popupInfo.className = 'popup-info';

  const popupInfoTitle = document.createElement('div');
  popupInfoTitle.className = 'popup-info-title';
  const popupInfoTitleSpan = document.createElement('span');
  popupInfoTitleSpan.className = 'popup-product-title';
  const desktopDeleteIcon = createPopupDeleteIcon();
  popupInfoTitle.append(popupInfoTitleSpan, desktopDeleteIcon);

  const popupInfoModel = document.createElement('div');
  popupInfoModel.className = 'popup-info-model';
  const modelLine = document.createElement('div');
  const popupInfoModelSpan = document.createElement('span');
  popupInfoModelSpan.textContent = 'Model:';
  const popupInfoModelValueSpan = document.createElement('span');
  popupInfoModelValueSpan.className = 'model-value';
  const stockLine = document.createElement('div');
  stockLine.className = 'stock-line';
  const stockImg = document.createElement('img');
  stockImg.className = 'stock-img';
  stockImg.src = `/content/dam/hisense/${country}/common-icons/correct.svg`;
  stockImg.alt = '';
  const stockSpan = document.createElement('span');
  stockSpan.textContent = 'In Stock';
  stockLine.append(stockImg, stockSpan);

  modelLine.append(popupInfoModelSpan, popupInfoModelValueSpan);
  popupInfoModel.append(modelLine, stockLine);

  const popupInfoPrice = document.createElement('div');
  popupInfoPrice.className = 'popup-info-price';
  const priceSpan = document.createElement('span');
  priceSpan.className = 'price-value';
  const desktopCountChangeEl = createPopupQuantityControl();

  popupInfoPrice.append(priceSpan, desktopCountChangeEl);
  popupInfo.append(popupInfoTitle, popupInfoModel, popupInfoPrice);
  popupList.append(img, popupInfo);

  const popupLine = document.createElement('div');
  popupLine.className = 'popup-line';

  const mobileCountEl = document.createElement('div');
  mobileCountEl.className = 'mobile-count-group';
  const mobileCountChangeEl = createPopupQuantityControl();
  const mobileDeleteIcon = createPopupDeleteIcon();
  mobileCountEl.append(mobileCountChangeEl, mobileDeleteIcon);

  const totalEl = document.createElement('div');
  totalEl.className = 'total';
  const totalSpan = document.createElement('div');
  totalSpan.className = 'total-span';
  totalSpan.innerHTML = 'Cart total (<span class="total-num">1</span> item)';
  const totalPriceSpan = document.createElement('span');
  totalPriceSpan.className = 'price-value';
  totalEl.append(totalSpan, totalPriceSpan);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group';
  const viewCartBtn = document.createElement('button');
  viewCartBtn.type = 'button';
  viewCartBtn.className = 'view-cart-btn';
  viewCartBtn.textContent = 'View cart';
  const checkoutBtn = document.createElement('button');
  checkoutBtn.type = 'button';
  checkoutBtn.className = 'checkout-btn';
  checkoutBtn.textContent = 'Proceed to checkout';
  checkoutBtn.hidden = true;
  btnGroup.append(viewCartBtn, checkoutBtn);

  popup.append(popupTitle, popupList, popupLine, mobileCountEl, totalEl, btnGroup);
  const mask = document.createElement('div');
  mask.id = 'product-card-mask';
  mask.addEventListener('click', closeProductCardPopup);

  popupElements.popup = popup;
  popupElements.mask = mask;
  popupElements.title = popupTitle;
  popupElements.image = img;
  popupElements.productTitle = popupInfoTitleSpan;
  popupElements.modelValue = popupInfoModelValueSpan;
  popupElements.stockLine = stockLine;
  popupElements.stockText = stockSpan;
  popupElements.unitPrice = priceSpan;
  popupElements.totalLabel = totalSpan;
  popupElements.totalPrice = totalPriceSpan;
  popupElements.deleteIcons = [desktopDeleteIcon, mobileDeleteIcon];
  popupElements.viewCartBtn = viewCartBtn;
  popupElements.checkoutBtn = checkoutBtn;
  popupElements.countControls = [desktopCountChangeEl, mobileCountChangeEl].map((control) => ({
    root: control,
    minusBtn: control.querySelector('.qty-decrease'),
    inputShell: control.querySelector('.qty-input-shell'),
    input: control.querySelector('.qty-input'),
    plusBtn: control.querySelector('.qty-increase'),
  }));

  popupElements.countControls.forEach(({ minusBtn, input, plusBtn }) => {
    minusBtn.addEventListener('click', (event) => {
      event.preventDefault();
      decreaseProductCardPopupQuantity().catch((error) => {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to handle popup quantity decrease', error);
      });
    });
    plusBtn.addEventListener('click', (event) => {
      event.preventDefault();
      increaseProductCardPopupQuantity().catch((error) => {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to handle popup quantity increase', error);
      });
    });
    ['beforeinput', 'keydown', 'paste'].forEach((eventName) => {
      input.addEventListener(eventName, (event) => {
        event.preventDefault();
      });
    });
  });

  popupElements.deleteIcons.forEach((icon) => {
    icon.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (icon.classList.contains('is-disabled')) {
        return;
      }
      removeProductCardPopupItem().catch((error) => {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to handle popup cart item deletion', error);
      });
    });
  });

  viewCartBtn.addEventListener('click', (event) => {
    event.preventDefault();
    navigateFromProductCardPopup(buildHybrisCartPageUrl(STOREFRONT_CART_URL, {
      authenticated: popupState.authenticated,
    }));
  });

  checkoutBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (!popupState.authenticated) {
      return;
    }
    navigateFromProductCardPopup(STOREFRONT_CHECKOUT_URL);
  });

  renderProductCardPopup();
  document.body.append(popup, mask);
}

// 是否使用 description_shortDescription 作为图片链接，默认使用
window.useShortDescriptionAsImage = false;

// 暴露渲染和筛选接口到window全局，供 filter/tags 使用（在 renderItems 定义后）
window.renderProductsInternal = function renderProductsInternalProxy(items) {
  if (typeof window.renderItems === 'function') {
    window.renderItems(items);
  }
};
window.lastRenderedProducts = null;
// 当前排序状态，用于筛选时判断是否需要默认选中最大尺寸
window.currentSortKey = '';

// 检查是否配置了默认排序
const checkAndApplyDefaultSort = () => {
  const selectedSortOption = document.querySelector('.plp-sort-option.selected');
  if (selectedSortOption) {
    const sortValue = selectedSortOption.dataset.value
        || selectedSortOption.getAttribute('data-value')
        || '';
    window.currentSortKey = sortValue.trim();
  }
};
// 确保 DOM 已加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndApplyDefaultSort);
} else {
  checkAndApplyDefaultSort();
}

window.renderPlpProducts = function renderPlpProductsWrapper(items) {
  window.lastRenderedProducts = Array.isArray(items) ? items.slice() : [];
  window.renderProductsInternal(items);
};

// 排序
// eslint-disable-next-line consistent-return
window.applyPlpSort = function applyPlpSort(sortKey) {
  try {
    const sortProperty = String(sortKey || '').trim();

    // 保存当前排序状态
    window.currentSortKey = sortProperty;

    let direction = -1; // 默认降序
    let effectiveSortProperty = sortProperty;
    if (effectiveSortProperty.startsWith('-')) {
      direction = 1; // 升序
      effectiveSortProperty = effectiveSortProperty.slice(1);
    }

    // 如果没有指定排序属性或者指size
    if (!effectiveSortProperty || effectiveSortProperty === 'size') {
      return applyAggregatedSort('size', direction);
    }

    // 其他属性也使用聚合后排序逻辑
    applyAggregatedSort(effectiveSortProperty, direction);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn(e);
  }
};

// 获取选中的 filter（checkbox 和 radio）
window.applyPlpFilters = function applyPlpFilters() {
  try {
    // 检查当前排序状态，如果是默认排序和 size，需要筛选后默认选中最大尺寸
    const currentSort = String(window.currentSortKey || '').trim();
    const effectiveSort = currentSort.startsWith('-') ? currentSort.slice(1) : currentSort;
    const isDefaultSort = (!effectiveSort || effectiveSort === 'size');
    window.isDefaultSortApplied = isDefaultSort;

    const allProducts = window.productData || [];
    const priceFilterState = window.getPlpPriceFilterState ? window.getPlpPriceFilterState() : null;

    // 收集所有被选中的 filter group，同组内为 OR，不同组为 AND
    const filterGroups = [...document.querySelectorAll('.plp-filter-group')];
    const selectedByGroup = filterGroups.map((group) => {
      // 同时收集 checkbox 和 radio 类型的选中项
      const checkboxes = [...group.querySelectorAll('input[type="checkbox"][data-option-value]:checked')];
      const radios = [...group.querySelectorAll('input[type="radio"][data-option-value]:checked')];

      const allInputs = [...checkboxes, ...radios];

      return allInputs
        .map((input) => {
          const value = input.getAttribute('data-option-value');
          // 对于 radio 类型，如果标签以 /no 结尾，忽略这个 filter
          if (input.type === 'radio' && value && value.toLowerCase().endsWith('/no')) {
            return null;
          }
          return value;
        })
        .filter((val) => val && val.length > 0);
    }).filter((arr) => arr && arr.length);

    // 执行过滤，要求产品必须要有 tags 属性
    const filtered = allProducts.filter((item) => {
      const tagsRaw = Array.isArray(item.tags) ? item.tags : [];
      const itemTags = tagsRaw.map((t) => String(t).toLowerCase());
      if (!itemTags.length) return false;

      const matchesTagFilters = selectedByGroup.every((groupSelected) => groupSelected.some((selectedTag) => {
        const selectedLower = String(selectedTag).toLowerCase();
        // 完全匹配标签路径
        return itemTags.includes(selectedLower);
      }));

      if (!matchesTagFilters) {
        return false;
      }

      if (!priceFilterState?.ready || typeof window.getPlpItemResolvedPrice !== 'function') {
        return true;
      }

      const itemPrice = Number(window.getPlpItemResolvedPrice(item));
      const normalizedPrice = Number.isFinite(itemPrice) ? itemPrice : 0;
      return normalizedPrice >= priceFilterState.selectedMin
        && normalizedPrice <= priceFilterState.selectedMax;
    });

    // 保存筛选结果，用于后续排序
    window.filteredProducts = filtered;

    // 如果有非默认排序，应用排序；否则直接渲染
    if (currentSort !== '' && !isDefaultSort && window.applyPlpSort) {
      // 非空且非默认排序 → 应用排序
      window.applyPlpSort(currentSort);
    } else if (currentSort === '' && window.filteredProducts && window.filteredProducts.length > 0) {
      // currentSort 为空字符串但有筛选结果时，使用默认排序（size 降序）
      applyAggregatedSort('size', -1);
    } else {
      // 无筛选或默认情况 → 直接渲染
      window.renderPlpProducts(filtered);
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    if (window.renderPlpProducts) window.renderPlpProducts(window.productData || []);
  }
};
