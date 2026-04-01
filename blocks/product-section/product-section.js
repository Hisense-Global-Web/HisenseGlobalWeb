/* eslint-disable no-console */
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
  startHybrisLogin,
  updateHybrisCartItem,
} from '../../scripts/hybris-bff.js';
import { loadCSS } from '../../scripts/aem.js';
import { getLocaleFromPath, localizeProductApiPath } from '../../scripts/locale-utils.js';
import { processPath } from '../../utils/carousel-common.js';

const { country } = getLocaleFromPath();
const WISHLIST_CART_NAME_PREFIX = 'wishlist';
const STOREFRONT_BASE_URL = 'https://usstorefront.cdrwhdl6-hisenseho2-d1-public.model-t.cc.commerce.ondemand.com';
const STOREFRONT_CART_URL = `${STOREFRONT_BASE_URL}/cart`;
const STOREFRONT_CHECKOUT_URL = new URL('/checkout/delivery-address', STOREFRONT_BASE_URL).toString();
let productSectionPopupCssPromise = null;

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

function setElementHidden(element, hidden) {
  if (!element) {
    return;
  }

  element.classList.toggle('hide', hidden);
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

function formatCurrencyValue(value, currency = 'USD') {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch (error) {
    return `$${numericValue.toFixed(2)}`;
  }
}

function resolveDisplayPrice(product) {
  if (typeof product?.priceInfo_regularPrice === 'string' && product.priceInfo_regularPrice.trim()) {
    return product.priceInfo_regularPrice.trim();
  }

  if (typeof product?.priceInfo_bottomPrice === 'string' && product.priceInfo_bottomPrice.trim()) {
    return product.priceInfo_bottomPrice.trim();
  }

  if (product?.priceInfo_regularPrice !== undefined) {
    return formatCurrencyValue(product.priceInfo_regularPrice, product?.priceInfo_currency || 'USD');
  }

  if (product?.priceInfo_bottomPrice !== undefined) {
    return formatCurrencyValue(product.priceInfo_bottomPrice, product?.priceInfo_currency || 'USD');
  }

  const directPrice = product?.price;
  if (typeof directPrice === 'string' && directPrice.trim()) {
    return directPrice.trim();
  }

  if (directPrice?.formattedValue) {
    return String(directPrice.formattedValue).trim();
  }

  if (directPrice?.value !== undefined) {
    return formatCurrencyValue(directPrice.value, directPrice.currencyIso || 'USD');
  }

  if (product?.originalPrice !== undefined) {
    return formatCurrencyValue(product.originalPrice, directPrice?.currencyIso || 'USD');
  }

  if (product?.priceRange?.maxPrice?.formattedValue) {
    return String(product.priceRange.maxPrice.formattedValue).trim();
  }

  if (product?.priceRange?.minPrice?.formattedValue) {
    return String(product.priceRange.minPrice.formattedValue).trim();
  }

  return '';
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

function getPriceDisplayText(price, fallbackCurrency = 'USD') {
  if (!price) {
    return '';
  }

  if (price.formattedValue) {
    return price.formattedValue;
  }

  return formatCurrencyValue(price.value, price.currencyIso || fallbackCurrency || 'USD');
}

function getPricingDetails(product, fallbackSource = null) {
  const pricing = product?.pricing || {};
  const fallbackPriceInfo = fallbackSource?.priceInfo || {};
  const fallbackCurrency = pricing.currency
    || product?.price?.currencyIso
    || product?.msrp?.currencyIso
    || fallbackSource?.priceInfo_currency
    || fallbackPriceInfo.currency
    || fallbackPriceInfo.currencyIso
    || 'USD';

  const fallbackSale = parseLoosePriceValue(
    fallbackPriceInfo.specialprice
      || fallbackPriceInfo.specialPrice
      || fallbackSource?.priceInfo_bottomPrice
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

function getVariantImageUrl(variant) {
  if (!variant) {
    return '';
  }

  const imageKey = variant.mediaGallery_image
    && Object.keys(variant.mediaGallery_image).find((key) => key.toLowerCase().includes('_path'));

  return imageKey ? variant.mediaGallery_image[imageKey] : '';
}

function getProductDisplayTitle(product, fallbackTitle = '') {
  if (!product) {
    return fallbackTitle || '';
  }

  return product.name
    || product.title
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

function normalizeWishlistKey(value) {
  return String(value || '').trim();
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

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.entries) && isWishlistCart(payload)) {
    return payload.entries.map((entry) => ({
      ...entry,
      cartCode: entry?.cartCode || payload.code || payload.cartCode || '',
    }));
  }

  if (payload?.wishlist) {
    return normalizeWishlistItems(payload.wishlist);
  }

  return [];
}

function buildWishlistEntryMap(payload) {
  const entriesByCode = new Map();
  const primaryCartCode = resolveWishlistCartCode(payload);

  normalizeWishlistItems(payload).forEach((item) => {
    const productCode = normalizeWishlistKey(getHybrisProductCode(item?.product || item));
    const entryNumber = item?.entryNumber ?? null;
    const cartCode = normalizeWishlistKey(item?.cartCode || primaryCartCode);

    if (!productCode) {
      return;
    }

    entriesByCode.set(productCode, {
      code: productCode,
      entryNumber,
      cartCode,
    });
  });

  return {
    primaryCartCode,
    entriesByCode,
  };
}

export default async function decorate(block) {
  const rows = [...(block.children || [])];
  let fields = [];
  let faqIconEl = null;
  let faqLink = '';
  let linkSku = '';
  rows.forEach((row, i) => {
    const text = row.textContent && row.textContent.trim();
    if (i === 1) {
      linkSku = row.textContent && row.textContent.trim();
    }
    if (i === 2 && text && text.indexOf(',') >= 0) {
      fields = text.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (fields.includes('faq')) {
      if (i === 3) {
        faqIconEl = row.querySelector('img');
      }
      if (i === 4) {
        const str = processPath(row.textContent.trim() || '');
        faqLink = `${str}?sku=${linkSku}`;
      }
    }
  });
  const link = block.querySelector('a');
  const endpoint = link ? link.getAttribute('href').trim() : '';

  const skuEl = block.querySelector('p[data-aue-prop="sku"]')
    || Array.from(block.querySelectorAll('p'))[1]
    || block.querySelector('p');
  const sku = skuEl ? skuEl.textContent.trim() : '';

  console.log('product-section: endpoint =', endpoint, 'sku =', sku);

  if (!endpoint || !sku) return;

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

  const url = getGraphQLUrl(endpoint);

  /**
   * 将新的 GraphQL 返回结构转换为可用的产品数组格式
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

  let json = null;
  try {
    const resp = await fetch(url);
    json = await resp.json();
  } catch (err) {
    console.error('product-section: failed to fetch product data, using mock', err);
    /* mock data */
    json = {};
  }

  let items = null;
  // 使用统一的数据转换函数处理 GraphQL 返回的各种格式
  items = transformTagStructureToProducts(json);

  // 根据SKU找到对应的产品
  const currentProduct = items ? items.find((item) => item.sku === sku) : null;
  const product = currentProduct || (items && items[0] ? items[0] : null);
  const currentProductCode = getHybrisProductCode(product) || sku;
  const supportsWishlist = Boolean(currentProductCode);
  const showFavoriteControl = fields.includes('favorite') || supportsWishlist;
  const showBuyButton = fields.includes('buttons') || Boolean(sku);
  if (product.category) {
    faqLink += `&category=${product.category}`;
  }

  // 将当前产品数据保存到window中供spec组件使用
  window.currentProduct = product;

  // 获取当前产品的factoryModel，找到同型号的产品
  const factoryModel = product ? product.factoryModel : null;
  const similarProducts = factoryModel && items
    ? items.filter((item) => item.factoryModel === factoryModel)
    : [];

  const info = document.createElement('div');
  info.className = 'pdp-info';

  const fav = document.createElement('div');
  fav.className = 'pdp-favorite';
  const likeEmpty = document.createElement('img');
  likeEmpty.className = 'pdp-like-empty';
  likeEmpty.src = `/content/dam/hisense/${country}/common-icons/like-empty.svg`;
  fav.appendChild(likeEmpty);
  const like = document.createElement('img');
  like.className = 'pdp-like';
  like.src = `/content/dam/hisense/${country}/common-icons/like.svg`;
  fav.appendChild(like);

  const series = document.createElement('div');
  series.className = 'pdp-series';
  series.textContent = (product && product.series) ? product.series : '';

  const title = document.createElement('h1');
  title.className = 'pdp-title';
  title.textContent = (product && product.title) ? product.title : '';

  const ratingWrapper = document.createElement('div');
  ratingWrapper.classList.add('rating-wrapper');

  for (let i = 1; i <= 5; i += 1) {
    const starImg = document.createElement('img');
    starImg.classList.add('rating-star');
    starImg.src = i <= Math.floor(product.score)
      ? `/content/dam/hisense/${country}/common-icons/icon-carousel/star-02.svg`
      : `/content/dam/hisense/${country}/common-icons/icon-carousel/star-01.svg`;
    starImg.alt = i <= product.score ? '满星' : '空白星';
    ratingWrapper.appendChild(starImg);
  }
  const ratingText = document.createElement('span');
  ratingText.classList.add('rating-text');
  ratingText.textContent = `${product.score} (${product.totalRatings} Ratings)`;
  ratingWrapper.appendChild(ratingText);

  const price = document.createElement('div');
  price.className = 'pdp-price';
  price.textContent = '';

  const sizesWrapper = document.createElement('div');
  sizesWrapper.className = 'pdp-sizes';
  // color
  const colorsWrapper = document.createElement('div');
  colorsWrapper.className = 'pdp-colors';
  const hasColorValue = similarProducts.some((item) => item.colorRGB);
  const sizeProducts = similarProducts.filter((item) => item.size);
  const hasSizeValue = sizeProducts.length > 0;
  if (similarProducts.length > 0) {
    // size 和 color 同时有值 优先显示color
    if (hasColorValue) {
      // const colorOrder = ['black', 'white', 'grey', 'silver', 'red', 'yellow', 'blue'];

      // // 创建颜色到索引的映射
      // const colorIndexMap = new Map(
      //   colorOrder.map((color, index) => [color, index]),
      // );

      // const sortedProducts = similarProducts.sort((a, b) => {
      //   const indexA = colorIndexMap.has(a.color) ? colorIndexMap.get(a.color) : Infinity;
      //   const indexB = colorIndexMap.has(b.color) ? colorIndexMap.get(b.color) : Infinity;
      //   return indexA - indexB;
      // });

      similarProducts.forEach((p) => {
        const el = document.createElement('div');
        el.classList.add('pdp-color');
        el.style.backgroundColor = p.colorRGB;
        if (p.colorRGB && (p.colorRGB.toLowerCase() === '#fff'
        || p.colorRGB.toLowerCase() === '#ffffff'
        || p.colorRGB.toLowerCase() === 'white'
        || p.colorRGB.toLowerCase() === 'rgb(255, 255, 255)')) {
          el.style.border = '1px solid #cfcfcf';
        }
        el.setAttribute('data-sku', p.sku);
        el.setAttribute('data-title', p.title);

        // 默认勾选当前SKU对应的尺寸
        if (p.sku === sku) {
          el.classList.add('selected');
        }

        // 添加点击事件
        el.addEventListener('click', () => {
        // 如果当前已经是选中状态，不执行跳转
          if (el.classList.contains('selected')) {
            return;
          }

          // 跳转到对应产品的whereToBuyLink链接
          let productLink = (p.whereToBuyLink || p.productDetailPageLink) || '';
          if (productLink) {
          // 如果当前URL是hisense.com/us，把链接中的/us/en改成/us
            if (window.location.hostname.includes('hisense.com') && window.location.pathname.startsWith('/us')) {
              productLink = productLink.replace('/us/en', '/us');
            }
            window.location.href = productLink;
          }
        });

        colorsWrapper.appendChild(el);
      });
    } else if (hasSizeValue) {
      // 对尺寸进行升序排序
      const sortedProducts = sizeProducts.sort((a, b) => {
        const sizeA = parseInt(a.size, 10);
        const sizeB = parseInt(b.size, 10);
        return sizeA - sizeB;
      });

      sortedProducts.forEach((p) => {
        const el = document.createElement('div');
        el.className = 'pdp-size';
        el.textContent = p.size;
        el.setAttribute('data-sku', p.sku);
        el.setAttribute('data-title', p.title);

        // 默认勾选当前SKU对应的尺寸
        if (p.sku === sku) {
          el.classList.add('selected');
        }

        // 添加点击事件
        el.addEventListener('click', () => {
        // 如果当前已经是选中状态，不执行跳转
          if (el.classList.contains('selected')) {
            return;
          }

          // 跳转到对应产品的whereToBuyLink链接
          let productLink = (p.whereToBuyLink || p.productDetailPageLink) || '';
          if (productLink) {
          // 如果当前URL是hisense.com/us，把链接中的/us/en改成/us
            if (window.location.hostname.includes('hisense.com') && window.location.pathname.startsWith('/us')) {
              productLink = productLink.replace('/us/en', '/us');
            }
            window.location.href = productLink;
          }
        });

        sizesWrapper.appendChild(el);
      });
    }
  }

  const badges = document.createElement('div');
  badges.className = 'pdp-badges';
  const badgesMobileGroup = document.createElement('div');
  badgesMobileGroup.className = 'pdp-badges-mobile-group';
  const badgesMobile = document.createElement('div');
  badgesMobile.className = 'pdp-badges-mobile';
  const badgesMobileTitle = document.createElement('div');
  badgesMobileTitle.className = 'pdp-badges-mobile-title';
  badgesMobileTitle.textContent = 'award winning';
  badgesMobileGroup.appendChild(badgesMobileTitle);
  if (product && Array.isArray(product.awards) && product.awards.length) {
    product.awards.forEach((award) => {
      const b = document.createElement('div');
      b.className = 'pdp-badge';
      const img = document.createElement('img');
      img.alt = 'award';
      // eslint-disable-next-line dot-notation
      const awardPath = award.path || award['_path'] || '';
      img.src = awardPath;
      img.loading = 'lazy';
      b.appendChild(img);
      badges.appendChild(b.cloneNode(true));
      const badgesMobileItem = document.createElement('div');
      badgesMobileItem.className = 'badges-mobile-item';
      badgesMobileItem.appendChild(b.cloneNode(true));
      badgesMobile.appendChild(badgesMobileItem);
    });
    badgesMobileGroup.appendChild(badgesMobile);
  }

  const buy = document.createElement('button');
  buy.className = 'pdp-buy-btn ps-widget';
  buy.setAttribute('ps-button-label', 'where to buy');
  buy.setAttribute('ps-sku', sku);
  // const buyLink = (product && (product.whereToBuyLink || product.productDetailPageLink)) || '';
  // if (buyLink) {
  //   buy.addEventListener('click', () => { window.location.href = buyLink; });
  // }

  const cart = document.createElement('button');
  cart.className = 'pdp-cart-btn';
  cart.textContent = 'Add to Cart';
  cart.style.display = 'none';
  const btnGroup = document.createElement('div');
  btnGroup.className = 'pdp-btn-group';
  btnGroup.append(cart, buy);

  const linkGroupEl = document.createElement('div');
  linkGroupEl.className = 'pdp-btn-link-group';

  const faqEl = document.createElement('div');
  faqEl.className = 'pdp-faq-btn';
  if (faqIconEl && faqLink) {
    faqEl.appendChild(faqIconEl);
    const faqLinkSpan = document.createElement('span');
    faqLinkSpan.textContent = 'FAQ';
    faqEl.appendChild(faqLinkSpan);
    faqEl.addEventListener('click', () => {
      if (faqLink) window.location.href = faqLink;
    });
    linkGroupEl.appendChild(faqEl);
  }

  const specsBtn = document.createElement('div');
  specsBtn.className = 'pdp-specs-btn';
  const specsImg = document.createElement('img');
  specsImg.src = `/content/dam/hisense/${country}/common-icons/specs.svg`;
  specsImg.alt = 'specs';
  specsBtn.appendChild(specsImg);
  const specsSpan = document.createElement('span');
  specsSpan.textContent = 'SPECS';
  specsBtn.appendChild(specsSpan);
  specsBtn.addEventListener('click', () => {
    const targetElement = document.getElementById('specifications');
    if (!targetElement) {
      return;
    }
    window.scrollTo({
      top: targetElement.offsetTop,
      behavior: 'auto',
    });
  });
  linkGroupEl.appendChild(specsBtn);
  setElementHidden(fav, !showFavoriteControl);
  if (!fields.includes('title')) {
    title.classList.add('hide');
  }
  if (!fields.includes('series')) {
    series.classList.add('hide');
  }
  if (!fields.includes('rating')) {
    ratingWrapper.classList.add('hide');
  }
  setElementHidden(buy, !showBuyButton);
  setElementHidden(price, true);
  if (!fields.includes('awards')) {
    badges.classList.add('hide');
  }
  if (!fields.includes('position')) {
    specsBtn.classList.add('hide');
  }
  info.append(fav, series, title, ratingWrapper);
  if (hasColorValue) {
    info.append(colorsWrapper);
  } else if (hasSizeValue) {
    info.append(sizesWrapper);
  }
  info.append(badges, price, btnGroup, linkGroupEl, badgesMobileGroup);

  block.replaceChildren(info);

  const wishlistState = {
    primaryCartCode: '',
    entriesByCode: new Map(),
    loaded: false,
    loadPromise: null,
  };
  const popupState = {
    productCode: '',
    authenticated: false,
    cart: null,
    entry: null,
    variant: null,
    representative: null,
    message: 'Item added to your cart',
    processing: false,
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

  async function ensureProductCardPopupStylesLoaded() {
    if (!productSectionPopupCssPromise) {
      const codeBasePath = window.hlx?.codeBasePath || '';
      productSectionPopupCssPromise = loadCSS(`${codeBasePath}/blocks/product-card/product-card.css`).catch((error) => {
        productSectionPopupCssPromise = null;
        throw error;
      });
    }

    return productSectionPopupCssPromise;
  }

  function syncButtonGroupVisibility() {
    const cartVisible = cart.style.display !== 'none';
    const buyVisible = !buy.classList.contains('hide');
    setElementHidden(btnGroup, !(cartVisible || buyVisible));
  }

  function setCartButtonVisibility(visible) {
    cart.style.display = visible ? 'block' : 'none';
    syncButtonGroupVisibility();
  }

  function setFavoriteVisibility(visible) {
    setElementHidden(fav, !(showFavoriteControl && visible));
  }

  function applyHybrisPriceDisplay(sourceProduct = null) {
    const nextPrice = resolveDisplayPrice(sourceProduct);
    price.textContent = nextPrice;
    setElementHidden(price, !nextPrice);
    return nextPrice;
  }

  function getWishlistEntry(productCode = currentProductCode) {
    return wishlistState.entriesByCode.get(normalizeWishlistKey(productCode)) || null;
  }

  function syncFavoriteState(productCode = currentProductCode) {
    const normalizedProductCode = normalizeWishlistKey(productCode);
    fav.dataset.productCode = normalizedProductCode;
    fav.classList.toggle('selected', Boolean(getWishlistEntry(normalizedProductCode)));
  }

  function clearWishlistState() {
    wishlistState.primaryCartCode = '';
    wishlistState.entriesByCode.clear();
    wishlistState.loaded = false;
    syncFavoriteState();
    return wishlistState;
  }

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

  function setCachedProductCardCart(nextCart) {
    cartCacheState.cart = nextCart || null;
    cartCacheState.hydrated = true;
    return cartCacheState.cart;
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

    popupElements.countControls.forEach(({ input, minusBtn, plusBtn }) => {
      input.value = String(quantity || 0);
      input.readOnly = true;
      input.setAttribute('readonly', 'readonly');
      input.setAttribute('inputmode', 'none');
      input.setAttribute('aria-label', 'Quantity');
      minusBtn.disabled = popupState.processing || !canAdjustExistingEntry || quantity <= 1;
      plusBtn.disabled = popupState.processing || !popupState.productCode;
    });

    popupElements.deleteIcons.forEach((icon) => {
      const disabled = popupState.processing || !canAdjustExistingEntry;
      icon.classList.toggle('is-disabled', disabled);
      icon.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      icon.setAttribute('title', disabled
        ? 'Delete is available after this item is in the cart'
        : 'Remove item from cart');
    });

    popupElements.viewCartBtn.disabled = false;
    popupElements.viewCartBtn.removeAttribute('title');

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

  function navigateFromProductCardPopup(targetUrl) {
    if (!targetUrl) {
      return;
    }

    closeProductCardPopup();
    window.location.assign(targetUrl);
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
        const authState = await initializeHybrisAuth();
        authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        console.warn('Failed to resolve Hybris auth state before PDP cart preload', authError);
      }

      try {
        const nextCart = await fetchHybrisCart({
          authenticated,
          redirectOnAuthFailure: false,
          returnUrl: window.location.href,
        });
        return setCachedProductCardCart(nextCart);
      } catch (error) {
        console.warn('Failed to preload PDP cart', error);
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
    await ensureProductCardPopupStylesLoaded();
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

    renderProductCardPopup();
    setProductCardPopupVisibility(true);
  }

  async function increaseProductCardPopupQuantity() {
    if (!popupState.productCode || popupState.processing) {
      return;
    }

    const previousMessage = popupState.message;
    const previousQuantity = getCartEntryQuantity(popupState.entry);
    popupState.processing = true;
    renderProductCardPopup();

    try {
      try {
        const authState = await initializeHybrisAuth();
        popupState.authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        console.warn('Failed to resolve PDP auth state before popup add to cart', authError);
      }

      await addHybrisCartItem(popupState.productCode, 1, {
        authenticated: popupState.authenticated,
        redirectOnAuthFailure: true,
        returnUrl: window.location.href,
      });
      await refreshProductCardPopupCart();
      popupState.message = previousQuantity > 0 ? 'Cart updated' : 'Item added to your cart';
    } catch (error) {
      console.warn(`Failed to increase PDP cart quantity for ${popupState.productCode}`, error);
      popupState.message = previousMessage;
    } finally {
      popupState.processing = false;
      renderProductCardPopup();
    }
  }

  async function decreaseProductCardPopupQuantity() {
    const entryNumber = getCartEntryNumber(popupState.entry);
    const currentQuantity = getCartEntryQuantity(popupState.entry);
    if (popupState.processing || entryNumber === null || currentQuantity <= 1) {
      return;
    }

    popupState.processing = true;
    renderProductCardPopup();

    try {
      try {
        const authState = await initializeHybrisAuth();
        popupState.authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        console.warn('Failed to resolve PDP auth state before popup cart decrease', authError);
      }

      await updateHybrisCartItem(entryNumber, currentQuantity - 1, {
        authenticated: popupState.authenticated,
        redirectOnAuthFailure: true,
        returnUrl: window.location.href,
      });
      await refreshProductCardPopupCart();
      popupState.message = 'Cart updated';
    } catch (error) {
      console.warn(`Failed to decrease PDP cart quantity for ${popupState.productCode}`, error);
    } finally {
      popupState.processing = false;
      renderProductCardPopup();
    }
  }

  async function removeProductCardPopupItem() {
    const entryNumber = getCartEntryNumber(popupState.entry);
    if (popupState.processing || entryNumber === null) {
      return;
    }

    popupState.processing = true;
    renderProductCardPopup();

    try {
      try {
        const authState = await initializeHybrisAuth();
        popupState.authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        console.warn('Failed to resolve PDP auth state before popup cart delete', authError);
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
      console.warn(`Failed to remove PDP cart item for ${popupState.productCode}`, error);
    } finally {
      popupState.processing = false;
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

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'qty-action qty-increase';
    btnPlus.textContent = '+';

    countChangeEl.append(qtySpan, btnMinus, inputEl, btnPlus);
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

  async function ensureProductCardPopupElements() {
    if (popupElements.popup && popupElements.mask) {
      return;
    }

    await ensureProductCardPopupStylesLoaded();

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

    const popupBtnGroup = document.createElement('div');
    popupBtnGroup.className = 'btn-group';
    const viewCartBtn = document.createElement('button');
    viewCartBtn.type = 'button';
    viewCartBtn.className = 'view-cart-btn';
    viewCartBtn.textContent = 'View cart';
    const checkoutBtn = document.createElement('button');
    checkoutBtn.type = 'button';
    checkoutBtn.className = 'checkout-btn';
    checkoutBtn.textContent = 'Proceed to checkout';
    checkoutBtn.hidden = true;
    popupBtnGroup.append(viewCartBtn, checkoutBtn);

    popup.append(popupTitle, popupList, popupLine, mobileCountEl, totalEl, popupBtnGroup);
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
      input: control.querySelector('.qty-input'),
      plusBtn: control.querySelector('.qty-increase'),
    }));

    popupElements.countControls.forEach(({ minusBtn, input, plusBtn }) => {
      minusBtn.addEventListener('click', (event) => {
        event.preventDefault();
        decreaseProductCardPopupQuantity().catch((error) => {
          console.warn('Failed to handle PDP popup quantity decrease', error);
        });
      });
      plusBtn.addEventListener('click', (event) => {
        event.preventDefault();
        increaseProductCardPopupQuantity().catch((error) => {
          console.warn('Failed to handle PDP popup quantity increase', error);
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
          console.warn('Failed to handle PDP popup cart item deletion', error);
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

  async function ensureWishlistLoaded(options = {}) {
    const { force = false } = options;

    if (!force && wishlistState.loaded) {
      return wishlistState;
    }

    if (!force && wishlistState.loadPromise) {
      return wishlistState.loadPromise;
    }

    if (!getCachedHybrisAuthState().authenticated) {
      return clearWishlistState();
    }

    wishlistState.loadPromise = (async () => {
      try {
        const payload = await fetchHybrisWishlist({
          redirectOnAuthFailure: false,
          returnUrl: window.location.href,
        });
        const nextState = buildWishlistEntryMap(payload);
        wishlistState.primaryCartCode = nextState.primaryCartCode;
        wishlistState.entriesByCode = nextState.entriesByCode;
        wishlistState.loaded = true;
        syncFavoriteState();
        return wishlistState;
      } catch (error) {
        if (error?.status === 401 || error?.errorCode === 'AUTH_REQUIRED') {
          return clearWishlistState();
        }
        throw error;
      } finally {
        wishlistState.loadPromise = null;
      }
    })();

    return wishlistState.loadPromise;
  }

  async function refreshPdpCommerceState() {
    if (!currentProductCode) {
      setCartButtonVisibility(false);
      setFavoriteVisibility(false);
      applyHybrisPriceDisplay(null);
      clearWishlistState();
      syncFavoriteState('');
      return;
    }

    try {
      const commerceProduct = await fetchHybrisProduct(currentProductCode);
      applyHybrisPriceDisplay(commerceProduct);
      const inventoryAvailable = hasInventory(commerceProduct);
      setCartButtonVisibility(inventoryAvailable);
      setFavoriteVisibility(inventoryAvailable);

      if (!inventoryAvailable) {
        clearWishlistState();
        return;
      }

      ensureProductCardPopupElements().catch((popupError) => {
        console.warn('Failed to initialize PDP cart popup elements', popupError);
      });
      preloadProductCardCart().catch((cartError) => {
        console.warn('Failed to preload PDP cart after inventory check', cartError);
      });
    } catch (error) {
      console.warn(`Failed to load PDP commerce data for ${currentProductCode}`, error);
      setCartButtonVisibility(false);
      setFavoriteVisibility(false);
      applyHybrisPriceDisplay(null);
      clearWishlistState();
      return;
    }

    try {
      await initializeHybrisAuth();
      await ensureWishlistLoaded();
    } catch (error) {
      console.warn(`Failed to initialize PDP wishlist state for ${currentProductCode}`, error);
      clearWishlistState();
    }
  }

  setFavoriteVisibility(false);
  setCartButtonVisibility(false);

  fav.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentProductCode || fav.dataset.loading === 'true') {
      return;
    }

    setControlLoadingState(fav, true);
    try {
      const authState = await initializeHybrisAuth();
      if (!authState?.authenticated) {
        startHybrisLogin(window.location.href);
        return;
      }

      await ensureWishlistLoaded();
      const existingEntry = getWishlistEntry(currentProductCode);
      if (existingEntry?.entryNumber !== null && existingEntry?.entryNumber !== undefined) {
        await removeHybrisWishlistItem(existingEntry.entryNumber, {
          cartCode: existingEntry.cartCode || wishlistState.primaryCartCode,
          redirectOnAuthFailure: true,
          returnUrl: window.location.href,
        });
      } else {
        const addOptions = {
          redirectOnAuthFailure: true,
          returnUrl: window.location.href,
        };
        const resolvedCartCode = normalizeWishlistKey(wishlistState.primaryCartCode);
        if (resolvedCartCode) {
          addOptions.cartCode = resolvedCartCode;
        }
        await addHybrisWishlistItem(currentProductCode, 1, addOptions);
      }

      await ensureWishlistLoaded({ force: true });
    } catch (error) {
      console.warn(`Failed to toggle PDP wishlist item for ${currentProductCode}`, error);
      await ensureWishlistLoaded({ force: true }).catch(() => clearWishlistState());
    } finally {
      setControlLoadingState(fav, false);
      syncFavoriteState();
    }
  });

  cart.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentProductCode || cart.dataset.loading === 'true') {
      return;
    }

    setControlLoadingState(cart, true);
    try {
      let authenticated = Boolean(getCachedHybrisAuthState().authenticated);
      try {
        const authState = await initializeHybrisAuth();
        authenticated = Boolean(authState?.authenticated);
      } catch (authError) {
        console.warn(`Failed to resolve PDP auth state before add to cart for ${currentProductCode}`, authError);
      }

      await ensureProductCardPopupElements();
      const existingCart = await getPreloadedProductCardCart();
      await openProductCardPopup({
        productCode: currentProductCode,
        authenticated,
        cart: existingCart,
        representative: product,
        variant: product,
        message: 'Add item to your cart',
      });
      await increaseProductCardPopupQuantity();
    } catch (error) {
      console.warn(`Failed to add PDP product to cart for ${currentProductCode}`, error);
    } finally {
      setControlLoadingState(cart, false);
    }
  });

  syncFavoriteState();
  refreshPdpCommerceState().catch((error) => {
    console.warn('Failed to initialize PDP commerce state', error);
  });

  const pdpNav = document.createElement('div');
  pdpNav.className = 'pdp-nav';
  pdpNav.innerHTML = `<div class="pdp-nav-content">
    <span>${(product && product.title) ? product.title : ''}</span>
    <img class="pdp-nav-content-btn" src="/content/dam/hisense/${country}/common-icons/chevron-up.svg"  alt=""/>
    </div>
  <div class="pdp-nav-menu hide"></div>`;

  pdpNav.querySelector('.pdp-nav-content-btn').addEventListener('click', () => {
    document.querySelector('.pdp-nav-menu').classList.toggle('hide');
  });
  const overviewMobileBtn = document.createElement('div');
  overviewMobileBtn.classList.add('pdp-nav-menu-item');
  overviewMobileBtn.textContent = 'Overview';
  overviewMobileBtn.addEventListener('click', () => {
    // const targetElement = document.getElementById('overview');
    // if (!targetElement) {
    //   return;
    // }
    // const targetPosition = targetElement.getBoundingClientRect().top;
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  });
  const specsMobileBtn = document.createElement('div');
  specsMobileBtn.classList.add('pdp-nav-menu-item');
  specsMobileBtn.textContent = 'Specs';
  specsMobileBtn.addEventListener('click', (e) => {
    const targetElement = document.getElementById('specifications');
    const headerTop = document.querySelector('.pdp-nav').getBoundingClientRect().height || 0;
    if (!targetElement) {
      return;
    }
    const grandParent = e.target.closest('.pdp-nav-menu');
    grandParent.classList.add('hide');
    window.scrollTo({
      top: targetElement.offsetTop - headerTop,
      behavior: 'auto',
    });
  });

  const faqMobileBtn = document.createElement('div');
  faqMobileBtn.classList.add('pdp-nav-menu-item');
  faqMobileBtn.textContent = 'Faq';
  faqMobileBtn.addEventListener('click', () => {
    if (faqLink) window.location.href = faqLink;
  });

  const pdpNavMenu = pdpNav.querySelector('.pdp-nav-menu');
  pdpNavMenu.append(overviewMobileBtn);
  let h = 61;
  if (fields.includes('position')) {
    pdpNavMenu.append(specsMobileBtn);
    h += 45;
  }
  if (faqLink) {
    pdpNavMenu.append(faqMobileBtn);
    h += 45;
  }
  pdpNavMenu.style.height = `${h}px`;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const blockHeight = block.getBoundingClientRect()?.height || 0;
    if (scrollTop > blockHeight) {
      pdpNav.querySelector('.pdp-nav-menu').style.display = 'flex';
      pdpNav.style.top = 0;
    } else {
      pdpNav.querySelector('.pdp-nav-menu').classList.add('hide');
      pdpNav.querySelector('.pdp-nav-menu').style.display = 'none';
      pdpNav.style.top = '-78px';
    }
  });

  block.appendChild(pdpNav);
}
