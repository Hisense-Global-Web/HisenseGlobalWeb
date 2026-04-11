export default function cloneSupportSearchSortBar(options = {}) {
  const {
    sourceRoot = null,
    type = '',
  } = options;

  if (type !== 'product') {
    return null;
  }

  const sortBar = sourceRoot?.querySelector?.('.plp-filters-bar');
  if (!sortBar?.cloneNode) {
    return null;
  }

  return sortBar.cloneNode(true);
}
