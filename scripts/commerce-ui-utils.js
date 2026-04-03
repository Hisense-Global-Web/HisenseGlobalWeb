export default function shouldShowAddToCartButton(options = {}) {
  const {
    hasPrice = false,
    hasInventory = false,
  } = options;

  return Boolean(hasPrice && hasInventory);
}
