const HYBRIS_ACCOUNT_MENU_ITEMS = [
  { label: 'Account Home', suffix: '' },
  { label: 'Orders', suffix: '/orders' },
  { label: 'Wishlist', suffix: '/wishlist' },
  { label: 'Address', suffix: '/address-book' },
  { label: 'Coupons', suffix: '/coupons' },
];

const ACCOUNT_COUNT_KEY_BY_LABEL = {
  Orders: 'orders',
  Wishlist: 'wishlist',
  Address: 'addresses',
  Coupons: 'coupons',
};

export const DEFAULT_HEADER_COMMERCE_COUNTS = {
  cart: 0,
  orders: 0,
  wishlist: 0,
  addresses: 0,
  coupons: 0,
};

export function hasValidHybrisAccountState(authState = {}) {
  return Boolean(
    authState?.authenticated
      && authState?.myAccountUrl
      && Number(authState?.expiresAt) > Date.now(),
  );
}

function normalizeCount(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }
  return Math.floor(numericValue);
}

function formatCountBadge(value, options = {}) {
  const { showZero = false } = options;
  const normalizedValue = normalizeCount(value);
  if (!normalizedValue && !showZero) {
    return '';
  }
  return normalizedValue > 99 ? '99+' : String(normalizedValue);
}

function hasOwnCountValue(payload, key) {
  return payload?.[key] !== undefined && payload?.[key] !== null;
}

function getPagedCollectionCount(payload, itemKey) {
  if (hasOwnCountValue(payload, 'totalCount')) {
    return normalizeCount(payload.totalCount);
  }

  if (hasOwnCountValue(payload?.pagination || {}, 'totalResults')) {
    return normalizeCount(payload.pagination.totalResults);
  }

  if (hasOwnCountValue(payload, 'totalResults')) {
    return normalizeCount(payload.totalResults);
  }

  if (hasOwnCountValue(payload, 'count')) {
    return normalizeCount(payload.count);
  }

  const itemList = Array.isArray(payload?.[itemKey]) ? payload[itemKey] : [];
  return itemList.length;
}

export function getOrdersCount(orders = {}) {
  return getPagedCollectionCount(orders, 'orders');
}

export function getCouponsCount(coupons = {}) {
  return getPagedCollectionCount(coupons, 'coupons');
}

export function getAddressesCount(addresses = {}) {
  let addressList = [];
  if (Array.isArray(addresses?.data?.addresses)) {
    addressList = addresses.data.addresses;
  } else if (Array.isArray(addresses?.addresses)) {
    addressList = addresses.addresses;
  }
  return addressList.length;
}

function splitMyAccountUrl(myAccountUrl) {
  if (!myAccountUrl || typeof window === 'undefined') {
    return null;
  }

  try {
    const parsedUrl = new URL(myAccountUrl, window.location.origin);
    return {
      domain: parsedUrl.origin,
      uri: parsedUrl.pathname === '/' ? '' : parsedUrl.pathname.replace(/\/+$/, ''),
    };
  } catch (error) {
    return null;
  }
}

export function buildAccountProfileHref(myAccountUrl = '') {
  if (typeof window === 'undefined') {
    return '/my-account/update-profile';
  }

  try {
    const parsedUrl = new URL(myAccountUrl || '/my-account', window.location.origin);
    const normalizedPathname = parsedUrl.pathname === '/'
      ? '/my-account'
      : parsedUrl.pathname.replace(/\/+$/, '');
    return `${parsedUrl.origin}${normalizedPathname}/update-profile`;
  } catch (error) {
    return '/my-account/update-profile';
  }
}

export function buildAccountMenuLinks(
  myAccountUrl,
  commerceCounts = DEFAULT_HEADER_COMMERCE_COUNTS,
) {
  const urlParts = splitMyAccountUrl(myAccountUrl);
  if (!urlParts) {
    return [];
  }

  return HYBRIS_ACCOUNT_MENU_ITEMS.map(({ label, suffix, showZeroCount = false }) => {
    const countKey = ACCOUNT_COUNT_KEY_BY_LABEL[label];
    return {
      label,
      href: `${urlParts.domain}${urlParts.uri}${suffix}`,
      count: countKey ? normalizeCount(commerceCounts?.[countKey]) : 0,
      showZeroCount,
    };
  });
}

export function buildAccountMenuItemChildren(doc, options = {}) {
  const {
    label = '',
    count = 0,
    showZeroCount = false,
  } = options;

  const titleEl = doc.createElement('span');
  titleEl.className = 'my-product-title';
  titleEl.textContent = label;

  const children = [titleEl];
  const countText = formatCountBadge(count, { showZero: showZeroCount });
  if (countText) {
    const countEl = doc.createElement('span');
    countEl.className = 'my-count-span';
    countEl.textContent = countText;
    children.push(countEl);
  }

  return children;
}

function shouldRefreshHeaderCommerceCountsForAuthStateChange(
  previousAuthState = {},
  nextAuthState = {},
) {
  return hasValidHybrisAccountState(previousAuthState)
    !== hasValidHybrisAccountState(nextAuthState);
}

export function shouldRefreshHeaderCommerceCountsAfterAuthInit(
  previousAuthState = {},
  nextAuthState = {},
) {
  return shouldRefreshHeaderCommerceCountsForAuthStateChange(previousAuthState, nextAuthState);
}

export function shouldRefreshHeaderCommerceCountsAfterAuthEvent(
  previousAuthState = {},
  nextAuthState = {},
) {
  return shouldRefreshHeaderCommerceCountsForAuthStateChange(previousAuthState, nextAuthState);
}
