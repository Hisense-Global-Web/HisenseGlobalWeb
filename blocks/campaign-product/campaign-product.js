import { getGraphQLUrl } from '../../scripts/locale-utils.js';
import { resolveProductCardTagLabel, shouldShowPlpFavoriteButton } from '../../scripts/commerce-ui-utils.js';
import {
  addHybrisWishlistItem,
  fetchHybrisProduct, fetchHybrisWishlist,
  getCachedHybrisAuthState,
  getHybrisProductCode,
  initializeHybrisAuth, removeHybrisWishlistItem,
  scheduleHybrisTask, startHybrisLogin,
} from '../../scripts/hybris-bff.js';
import { isMobileWindow } from '../../scripts/device.js';
import { processPath } from '../../utils/carousel-common.js';
import { readBlockConfig } from '../../scripts/aem.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
const DEFAULT_TAGS_ENDPOINT = `/bin/hisense/tags.json?_t=${Date.now()}`;
const WISHLIST_CART_NAME_PREFIX = 'wishlist';
const wishlistEntriesByCode = new Map();
let wishlistLoadPromise = null;
let wishlistLoaded = false;
let wishlistRequestVersion = 0;
let wishlistPrimaryCartCode = '';

function getTagsEndpointUrl() {
  const baseUrl = window.GRAPHQL_BASE_URL || '';
  return baseUrl ? `${baseUrl}${DEFAULT_TAGS_ENDPOINT}` : DEFAULT_TAGS_ENDPOINT;
}

function extractTags(data, tags = {}) {
  Object.keys(data).forEach((key) => {
    // 跳过 JCR 系统属性
    if (!key.startsWith('jcr:') && typeof data[key] === 'object' && data[key] !== null) {
      // 如果当前节点有 jcr:title，说明它是一个标签节点
      if (data[key]['jcr:title']) {
        tags[key] = data[key]['jcr:title'];
      }
      // 递归处理子节点
      extractTags(data[key], tags);
    }
  });
  return tags;
}
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
  document.querySelectorAll('.favorite[data-product-code]').forEach((favorite) => {
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

function ensureWishlistLoaded(force = false) {
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

function createScrollButton(direction) {
  const button = document.createElement('div');
  button.type = 'button';
  button.className = `scroll-btn scroll-${direction}`;
  button.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
  button.disabled = direction === 'left';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left-g.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right-g.svg`;
  img.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right.svg`;
  imgClick.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
  return button;
}

function updatePositionBarLeft(currentIndex, dataListLength) {
  const bar = document.querySelector('.data-position-bar');
  if (bar) {
    const totalWidth = 400;
    const barWidth = 1600 / dataListLength;
    const showItemCount = 4;
    const maxMoveDistance = totalWidth - barWidth;
    bar.style.left = `${(maxMoveDistance / Math.max((dataListLength - showItemCount), 1) || 0) * currentIndex}px`;
  }
}

function scrollToIndex(targetIndex, flatList, previewListEl, btnGroupEl) {
  const ITEM_WIDTH = 262 + 24;
  // 边界处理：不能小于0，也不能超过最大可滚动索引
  const maxIndex = Math.max(0, flatList.length - 4);
  const finalIndex = Math.min(Math.max(0, targetIndex), maxIndex);

  // 更新滚动状态
  window.currentIndex = finalIndex;
  window.currentX = ITEM_WIDTH * finalIndex;
  window.IS_LEFTEST = finalIndex <= 0;
  window.IS_RIGHTEST = finalIndex >= maxIndex;

  // 更新预览列表位置
  previewListEl.style.transform = `translateX(-${window.currentX}px)`;

  // 更新按钮状态和位置条
  updatePositionBarLeft(finalIndex, flatList.length);
  btnGroupEl.className = `btn-group ${window.IS_LEFTEST ? 'leftest' : ''} ${window.IS_RIGHTEST ? 'rightest' : ''}`;
}
export default async function decorate(block) {
  const data = [];
  let currentX = 0;
  let currentIndex = 0;
  const ITEM_WIDTH = 262 + 24;
  let IS_LEFTEST = true;
  let IS_RIGHTEST = false;
  const flatList = [];
  const shouldShowPrice = true;
  let commerceRequestId = 0;
  let wishlistStateReady = false;
  let favoriteEnabled = false;
  let favoriteAuthenticated = Boolean(getCachedHybrisAuthState().authenticated);
  let preOrderButtonLink = '';
  let preOrderButtonLabel = '';
  let FIRST_ITEM_INDEX = 0;

  // eslint-disable-next-line no-restricted-syntax
  const rows = [...block.children];
  const config = readBlockConfig(block);
  if (config.text) {
    FIRST_ITEM_INDEX += 1;
    preOrderButtonLabel = config.text;
  }
  if (config.link) {
    FIRST_ITEM_INDEX += 1;
    preOrderButtonLink = processPath(config.link);
  }
  const mobileUlDiv = document.createElement('div');
  mobileUlDiv.classList.add('campaign-product-ul');
  rows.forEach((row) => {
    mobileUlDiv.appendChild(row);
  });
  block.appendChild(mobileUlDiv);
  for (let i = 0; i < FIRST_ITEM_INDEX; i += 1) {
    const row = rows[i];
    row.style.display = 'none';
  }

  for (let i = FIRST_ITEM_INDEX; i < rows.length; i += 1) {
    const row = rows[i];
    row.classList.add('campaign-category');
    if (i === FIRST_ITEM_INDEX) row.classList.add('active');
    // eslint-disable-next-line no-loop-func
    row.addEventListener('click', (e) => {
      const elList = e.currentTarget.parentNode.querySelectorAll('.campaign-category');
      elList.forEach((el) => {
        el.classList.remove('active');
      });
      e.currentTarget.classList.add('active');
      if (isMobileWindow()) {
        const parentWrapper = e.currentTarget.closest('.campaign-product-wrapper');
        if (parentWrapper) {
          parentWrapper.className = parentWrapper.className.replace(/\bwrapper-series-index-\d+\b/g, '');
          parentWrapper.classList.add(`wrapper-series-index-${i}`);
        }
        return;
      }
      const sIndex = [...elList].indexOf(e.currentTarget);
      const targetIndex = flatList.findIndex((item) => item.seriesIndex === sIndex);
      currentIndex = targetIndex;
      if (targetIndex !== -1) {
        // eslint-disable-next-line no-use-before-define
        scrollToIndex(targetIndex, flatList, previewListEl, btnGroupEl);
      }
    });
    const category = {
      name: '',
      src: '',
      products: [],
    };
    let itemAllList = null;
    const items = [...row.children];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];

      if (index === 0) {
        const imgEl = item.querySelector('img');
        category.src = imgEl?.src;
        item.classList.add('category-img');
      } else if (index === 1) {
        category.name = item.textContent.trim();
        item.classList.add('category-title');
      } else if (index === 2) {
        const aEl = item.querySelector('a');
        try {
          const href = aEl?.getAttribute('href').trim() ?? '';
          const fixHref = getGraphQLUrl(href);
          // eslint-disable-next-line no-await-in-loop
          const tagResp = await fetch(getTagsEndpointUrl());
          // eslint-disable-next-line no-await-in-loop
          const tagsData = await tagResp.json();
          window.extractedTags = extractTags(tagsData);
          // eslint-disable-next-line no-await-in-loop
          const resp = await fetch(fixHref);
          // eslint-disable-next-line no-await-in-loop
          const respJson = await resp.json();
          itemAllList = respJson.data.productModelList.items;
        } catch (err) { /* empty */ }
        item.style.display = 'none';
      } else {
        const filterSku = item.textContent.trim();
        const currentProduct = itemAllList?.find((p) => p.sku.toLowerCase() === filterSku.toLowerCase());
        if (currentProduct) {
          category.products.push(currentProduct);
        }
        item.style.display = 'none';
      }
    }
    data.push(category);
  }

  data.forEach((series, sIndex) => {
    series.products.forEach((p) => {
      flatList.push({
        ...p,
        seriesIndex: sIndex,
      });
    });
  });
  const previewGroupEl = document.createElement('div');
  previewGroupEl.classList.add('preview-group');
  const previewListEl = document.createElement('div');
  previewListEl.classList.add('preview-list');
  flatList.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `product-card series-index-${item.seriesIndex}`;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'product-card-title';
    const productCardTag = document.createElement('div');
    productCardTag.className = 'product-card-tag';
    productCardTag.textContent = resolveProductCardTagLabel(item);
    titleDiv.append(productCardTag);

    const fav = document.createElement('div');
    fav.className = 'favorite favorite-pending';
    // setControlLoadingState(fav, false);
    const likeEmpty = document.createElement('img');
    likeEmpty.className = 'like-empty';
    likeEmpty.src = `/content/dam/hisense/${country}/common-icons/like-empty.svg`;
    fav.appendChild(likeEmpty);
    const like = document.createElement('img');
    like.className = 'like';
    like.src = `/content/dam/hisense/${country}/common-icons/like.svg`;
    fav.appendChild(like);

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
      fav.classList.toggle('favorite-pending', canShowFavorite && !wishlistStateReady);
    };
    const authReadyPromise = scheduleHybrisTask(() => initializeHybrisAuth());
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
    const getVariantProductCode = (variant) => getHybrisProductCode(variant)
        || getHybrisProductCode(item);

    const refreshCommerceState = async (variant) => {
      const requestId = commerceRequestId + 1;
      commerceRequestId = requestId;

      const productCode = getVariantProductCode(variant);
      favoriteEnabled = false;
      updateFavoriteState(productCode);
      // eslint-disable-next-line no-use-before-define
      updatePriceState(null, variant);

      if (!productCode) {
        return;
      }

      await refreshFavoriteState(productCode, requestId);

      try {
        const commerceProduct = await fetchHybrisProduct(productCode);
        // eslint-disable-next-line no-use-before-define
        updatePriceState(commerceProduct, variant);
        favoriteEnabled = hasInventory(commerceProduct);
        updateFavoriteState(productCode);
      } catch (error) {
        /* eslint-disable-next-line no-console */
        console.warn(`Failed to load commerce data for ${productCode}`, error);
        if (requestId !== commerceRequestId) {
          return;
        }
        favoriteEnabled = false;
        updateFavoriteState(productCode);
      }
    };
    scheduleHybrisTask(() => refreshCommerceState(item)).catch((error) => {
      /* eslint-disable-next-line no-console */
      console.warn('Failed to refresh commerce state', error);
    });
    titleDiv.append(fav);

    const imgDiv = document.createElement('div');
    imgDiv.className = 'product-img';
    const imgPath = (() => {
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
    seriesDiv.className = 'product-series';
    if (item.series) seriesDiv.textContent = item.series;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
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
    const fullTitle = item.title || metaTitle || '';
    nameDiv.textContent = fullTitle;
    nameDiv.title = fullTitle;

    const priceGroupDiv = document.createElement('div');
    priceGroupDiv.className = 'product-price-group';
    priceGroupDiv.style.display = 'none';
    const currentPriceEl = document.createElement('h5');
    currentPriceEl.className = 'product-current-price';
    const currentPriceCurrency = document.createElement('span');
    const currentPriceValue = document.createElement('span');
    currentPriceEl.append(currentPriceCurrency, currentPriceValue);
    const originalPriceEl = document.createElement('div');
    originalPriceEl.className = 'product-original-price';
    const originalPriceCurrency = document.createElement('span');
    const originalPriceValue = document.createElement('span');
    originalPriceEl.append(originalPriceCurrency, originalPriceValue);

    const discountsDiv = document.createElement('div');
    discountsDiv.className = 'product-discounts';
    const discountsTitle = document.createElement('span');
    discountsTitle.textContent = 'Save';
    const discountsCurrency = document.createElement('span');
    const discountsValue = document.createElement('span');
    discountsDiv.append(discountsTitle, discountsCurrency, discountsValue);
    priceGroupDiv.append(currentPriceEl, originalPriceEl, discountsDiv);

    // create product button group
    const productBtnGroupEl = document.createElement('div');
    productBtnGroupEl.className = 'product-btn-group';
    if (!index && preOrderButtonLink && preOrderButtonLabel) {
      const link = document.createElement('a');
      link.className = 'pre-order-btn';
      link.target = '_blank';
      link.href = preOrderButtonLink;
      link.textContent = preOrderButtonLabel;
      productBtnGroupEl.append(link);
    }
    if (item.productDetailPageLink && item.productDetailPageLink !== '#') {
      const link = document.createElement('a');
      link.className = 'product-btn';
      link.target = '_blank';
      link.href = item.productDetailPageLink;
      link.textContent = 'Learn more';
      productBtnGroupEl.append(link);
    }

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

    fav.addEventListener('click', async (event) => {
      event.stopPropagation();

      const favoriteEl = event.currentTarget;
      const { productCode } = favoriteEl.dataset;
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

    card.append(titleDiv, imgDiv, seriesDiv, nameDiv, priceGroupDiv, productBtnGroupEl);
    previewListEl.appendChild(card);
  });

  const ctrlGroupEl = document.createElement('div');
  ctrlGroupEl.classList.add('ctrl-group');
  const positionBarEl = document.createElement('div');
  positionBarEl.classList.add('position-bar');
  const dataPositionBarEl = document.createElement('div');
  dataPositionBarEl.classList.add('data-position-bar');
  dataPositionBarEl.style.width = `${((1600 / Math.max(4, flatList.length)) * Math.min(window.innerWidth, 1440)) / 1440}px`;
  positionBarEl.append(dataPositionBarEl);
  const leftBtn = createScrollButton('left');
  const rightBtn = createScrollButton('right');
  const btnGroupEl = document.createElement('div');
  if (flatList.length < 5) {
    IS_RIGHTEST = true;
  }
  btnGroupEl.className = `btn-group ${IS_LEFTEST ? 'leftest' : ''} ${IS_RIGHTEST ? 'rightest' : ''}`;

  leftBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const elList = e.currentTarget.closest('.campaign-product-wrapper').querySelectorAll('.campaign-category');
    if (currentIndex <= 0) return;
    IS_RIGHTEST = false;
    const beforeSeriesIndex = flatList[currentIndex].seriesIndex;
    currentIndex -= 1;
    const afterSeriesIndex = flatList[currentIndex].seriesIndex;
    if (beforeSeriesIndex !== afterSeriesIndex) {
      elList[beforeSeriesIndex].classList.remove('active');
      elList[afterSeriesIndex].classList.add('active');
    }
    currentX = ITEM_WIDTH * currentIndex;
    previewListEl.style.transform = `translateX(-${currentX}px)`;
    IS_LEFTEST = currentIndex <= 0;
    updatePositionBarLeft(currentIndex, flatList.length);
    btnGroupEl.className = `btn-group ${IS_LEFTEST ? 'leftest' : ''} ${IS_RIGHTEST ? 'rightest' : ''}`;
  });

  rightBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const elList = e.currentTarget.closest('.campaign-product-wrapper').querySelectorAll('.campaign-category');
    if (currentIndex + 4 >= flatList.length) return;
    IS_LEFTEST = false;
    const beforeSeriesIndex = flatList[currentIndex].seriesIndex;
    currentIndex += 1;
    const afterSeriesIndex = flatList[currentIndex].seriesIndex;
    if (beforeSeriesIndex !== afterSeriesIndex) {
      elList[beforeSeriesIndex].classList.remove('active');
      elList[afterSeriesIndex].classList.add('active');
    }
    currentX = ITEM_WIDTH * currentIndex;
    previewListEl.style.transform = `translateX(-${currentX}px)`;
    IS_RIGHTEST = currentIndex + 4 >= flatList.length;
    updatePositionBarLeft(currentIndex, flatList.length);
    btnGroupEl.className = `btn-group ${IS_LEFTEST ? 'leftest' : ''} ${IS_RIGHTEST ? 'rightest' : ''}`;
  });
  btnGroupEl.append(leftBtn, rightBtn);
  ctrlGroupEl.append(positionBarEl, btnGroupEl);
  previewGroupEl.append(previewListEl, ctrlGroupEl);
  block.parentNode.append(previewGroupEl);
  const parentWrapper = block.closest('.campaign-product-wrapper');
  if (parentWrapper) {
    parentWrapper.classList.add('wrapper-series-index-0');
  }
}
