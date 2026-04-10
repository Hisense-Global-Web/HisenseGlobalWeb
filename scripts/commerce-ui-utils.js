export default function shouldShowAddToCartButton(options = {}) {
  const {
    hasPrice = false,
    hasInventory = false,
  } = options;

  return Boolean(hasPrice && hasInventory);
}

export function shouldShowHybrisFavoriteButton(options = {}) {
  const {
    authenticated = false,
    hasInventory = false,
  } = options;

  return Boolean(authenticated && hasInventory);
}

export function shouldShowPdpFavoriteButton(options = {}) {
  const {
    hasInventory = false,
  } = options;

  return Boolean(hasInventory);
}

export function shouldShowPlpFavoriteButton(options = {}) {
  const {
    hasInventory = false,
  } = options;

  return Boolean(hasInventory);
}

export function resolveProductCardTagLabel(product = {}) {
  const badgeList = Array.isArray(product?.badge) ? product.badge : [];
  const targetBadge = String(badgeList[0] || '').trim();
  if (!targetBadge) {
    return '';
  }

  const lastSlashIndex = targetBadge.lastIndexOf('/');
  return lastSlashIndex > -1 ? targetBadge.slice(lastSlashIndex + 1) : targetBadge;
}

export function resolvePopupQuantityDisplayState(options = {}) {
  const {
    quantity = 0,
    quantityLoading = false,
    pendingQuantityAction = '',
  } = options;

  const showLoading = Boolean(
    quantityLoading && ['increase', 'decrease'].includes(String(pendingQuantityAction || '').trim().toLowerCase()),
  );

  if (showLoading) {
    return {
      showLoading: true,
      value: '',
    };
  }

  const normalizedQuantity = Number(quantity);
  return {
    showLoading: false,
    value: String(Number.isFinite(normalizedQuantity) && normalizedQuantity > 0 ? normalizedQuantity : 0),
  };
}
