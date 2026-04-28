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

function createCommerceButtonVisibility(options = {}) {
  const {
    showAddToCart = false,
    showOutOfStock = false,
    showWhereToBuy = false,
    priceSpiderComingSoonMode = 'hide',
  } = options;

  return {
    showAddToCart,
    showOutOfStock,
    showWhereToBuy,
    priceSpiderComingSoonMode,
  };
}

export function resolveCommerceButtonVisibility(callToAction = 'whereToBuy', options = {}) {
  const normalizedCallToAction = String(callToAction || 'whereToBuy');
  const normalizedPageType = String(options.pageType || '').trim().toLowerCase();
  const hasHybrisData = Boolean(options.hasHybrisData ?? options.hasProductData);

  if (normalizedPageType === 'plp') {
    if (hasHybrisData) {
      if (normalizedCallToAction === 'addToCart') {
        return createCommerceButtonVisibility({
          showAddToCart: true,
        });
      }

      return createCommerceButtonVisibility({
        showOutOfStock: true,
      });
    }

    return createCommerceButtonVisibility({
      showWhereToBuy: true,
      priceSpiderComingSoonMode: 'showComingSoon',
    });
  }

  if (normalizedPageType === 'pdp') {
    if (!hasHybrisData) {
      return createCommerceButtonVisibility({
        showWhereToBuy: true,
        priceSpiderComingSoonMode: 'showWhereToBuy',
      });
    }

    if (normalizedCallToAction === 'addToCart') {
      return createCommerceButtonVisibility({
        showAddToCart: true,
        priceSpiderComingSoonMode: 'showWhereToBuy',
      });
    }

    if (normalizedCallToAction === 'outOfStock') {
      return createCommerceButtonVisibility({
        showOutOfStock: true,
        showWhereToBuy: true,
        priceSpiderComingSoonMode: 'showWhereToBuy',
      });
    }

    return createCommerceButtonVisibility({
      showWhereToBuy: true,
      priceSpiderComingSoonMode: 'showWhereToBuy',
    });
  }

  if (normalizedCallToAction === 'addToCart') {
    return createCommerceButtonVisibility({
      showAddToCart: true,
    });
  }

  if (normalizedCallToAction === 'outOfStock') {
    return createCommerceButtonVisibility({
      showOutOfStock: true,
    });
  }

  return createCommerceButtonVisibility({
    showWhereToBuy: true,
  });
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
    comingSoonMode = 'hide',
  } = options;
  const text = String(buttonLabel || fallbackText || '').trim();
  const normalizedAriaLabel = String(ariaLabel || '').trim().toLowerCase();
  const normalizedComingSoonMode = String(comingSoonMode || 'hide').trim();
  const isComingSoon = normalizedAriaLabel === 'coming soon';
  const state = {
    showWhereToBuy: !noSku && !isComingSoon,
    text,
  };

  if (!isComingSoon) {
    if (normalizedComingSoonMode !== 'hide') {
      state.isComingSoon = false;
    }
    return state;
  }

  if (normalizedComingSoonMode === 'showComingSoon') {
    return {
      showWhereToBuy: true,
      text: 'Coming Soon',
      isComingSoon: true,
      forceVisible: true,
    };
  }

  if (normalizedComingSoonMode === 'showWhereToBuy') {
    return {
      showWhereToBuy: true,
      text,
      isComingSoon: false,
      forceVisible: true,
    };
  }

  return state;
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
