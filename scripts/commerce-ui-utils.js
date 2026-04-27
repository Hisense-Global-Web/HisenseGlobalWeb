export default function shouldShowAddToCartButton(options = {}) {
  const {
    hasPrice = false,
    hasInventory = false,
  } = options;

  return Boolean(hasPrice && hasInventory);
}

export function resolveCommerceCallToAction(options = {}) {
  const {
    hasProductData = false,
    hasPrice = false,
    hasInventory = false,
  } = options;

  if (hasPrice && hasInventory) {
    return 'addToCart';
  }

  if (!hasProductData || !hasPrice) {
    return 'whereToBuy';
  }

  if (!hasInventory) {
    return 'outOfStock';
  }

  return 'whereToBuy';
}

export function resolveCommerceButtonVisibility(callToAction = 'whereToBuy') {
  const normalizedCallToAction = String(callToAction || 'whereToBuy');

  if (normalizedCallToAction === 'addToCart') {
    return {
      showAddToCart: true,
      showOutOfStock: false,
      showWhereToBuy: false,
    };
  }

  if (normalizedCallToAction === 'outOfStock') {
    return {
      showAddToCart: false,
      showOutOfStock: true,
      showWhereToBuy: false,
    };
  }

  return {
    showAddToCart: false,
    showOutOfStock: false,
    showWhereToBuy: true,
  };
}

export function resolveWhereToBuyButtonPresentation() {
  return {
    text: '',
    fallbackText: 'Where to buy',
    usePriceSpiderWidget: true,
    buttonLabel: 'where to buy',
  };
}

export function resolvePriceSpiderWhereToBuyState(options = {}) {
  const {
    noSku = false,
    ariaLabel = '',
    buttonLabel = '',
    fallbackText = 'Where to buy',
  } = options;
  const text = String(buttonLabel || fallbackText || '').trim();
  const normalizedAriaLabel = String(ariaLabel || '').trim().toLowerCase();

  return {
    showWhereToBuy: !noSku && normalizedAriaLabel !== 'coming soon',
    text,
  };
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
