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

export function shouldRefreshHeaderCommerceCountsAfterAuthInit(
  previousAuthState = {},
  nextAuthState = {},
) {
  return hasValidHybrisAccountState(previousAuthState)
    !== hasValidHybrisAccountState(nextAuthState);
}
