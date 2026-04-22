export default function buildOptimizedPictureUrl(
  src,
  currentLocationHref,
  {
    width,
    format,
    optimize = 'medium',
  },
) {
  const assetUrl = new URL(src, currentLocationHref);
  const currentUrl = new URL(currentLocationHref);

  assetUrl.searchParams.set('width', width);
  assetUrl.searchParams.set('format', format);
  assetUrl.searchParams.set('optimize', optimize);
  assetUrl.hash = '';

  if (assetUrl.origin === currentUrl.origin) {
    return `${assetUrl.pathname}${assetUrl.search}`;
  }

  return assetUrl.toString();
}
