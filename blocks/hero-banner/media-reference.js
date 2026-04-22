const VIDEO_MEDIA_EXTENSIONS = new Set([
  'mp4',
  'webm',
  'mov',
  'm4v',
  'm3u8',
  'ogv',
]);

function getAssetExtension(assetUrl = '') {
  if (!assetUrl) return '';

  try {
    const { pathname } = new URL(assetUrl, 'https://www.hisense.com');
    const fileName = pathname.split('/').pop() || '';
    return fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  } catch (error) {
    const sanitizedUrl = assetUrl.split('?')[0].split('#')[0];
    const fileName = sanitizedUrl.split('/').pop() || '';
    return fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  }
}

export function isVideoMediaUrl(assetUrl = '') {
  return VIDEO_MEDIA_EXTENSIONS.has(getAssetExtension(assetUrl));
}

export function isVideoMediaColumn(column) {
  const links = [...(column?.querySelectorAll?.('a') || [])]
    .filter((link) => link?.href);

  return links.length > 0 && links.every((link) => isVideoMediaUrl(link.href));
}

export function normalizeImageReferenceLinks(column, createPicture) {
  if (!column?.querySelectorAll || typeof createPicture !== 'function') return;

  [...column.querySelectorAll('a')].forEach((link) => {
    const href = link?.href || '';

    if (!href || isVideoMediaUrl(href) || link.querySelector?.('picture, img')) return;

    const picture = createPicture(href, link.textContent?.trim?.() || '', false);
    link.replaceWith(picture);
  });
}
