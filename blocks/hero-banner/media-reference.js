const VIDEO_MEDIA_EXTENSIONS = new Set([
  'mp4',
  'webm',
  'mov',
  'm4v',
  'm3u8',
  'ogv',
]);

const HERO_BANNER_DYNAMIC_MEDIA_CROPS = [
  { cropName: 'Small', cropWidth: 390 },
  { cropName: 'Medium', cropWidth: 860 },
  { cropName: 'Large', cropWidth: 1260 },
];

function getCurrentLocationHref() {
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }

  return 'http://localhost:3000/';
}

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

function buildSmartCropUrl(src, cropName, currentLocationHref = getCurrentLocationHref()) {
  if (!src || !cropName) return '';

  const assetUrl = new URL(src, currentLocationHref);
  const currentUrl = new URL(currentLocationHref);

  assetUrl.search = '';
  assetUrl.searchParams.set('smartcrop', String(cropName).trim());
  assetUrl.hash = '';

  if (assetUrl.origin === currentUrl.origin) {
    return `${assetUrl.pathname}${assetUrl.search}`;
  }

  return assetUrl.toString();
}

export function isVideoMediaUrl(assetUrl = '') {
  return VIDEO_MEDIA_EXTENSIONS.has(getAssetExtension(assetUrl));
}

export function isVideoMediaColumn(column) {
  const links = [...(column?.querySelectorAll?.('a') || [])]
    .filter((link) => link?.href);

  return links.length > 0 && links.every((link) => isVideoMediaUrl(link.href));
}

export function buildHeroBannerDynamicMediaSources(src, currentLocationHref = getCurrentLocationHref()) {
  return HERO_BANNER_DYNAMIC_MEDIA_CROPS.map(({ cropName, cropWidth }) => ({
    media: `(max-width: ${cropWidth}px)`,
    srcset: buildSmartCropUrl(src, cropName, currentLocationHref),
    width: String(cropWidth),
  }));
}

function createDynamicMediaPicture(src, alt = '') {
  const picture = document.createElement('picture');

  buildHeroBannerDynamicMediaSources(src).forEach((sourceConfig) => {
    const source = document.createElement('source');
    source.setAttribute('media', sourceConfig.media);
    source.setAttribute('srcset', sourceConfig.srcset);
    source.setAttribute('width', sourceConfig.width);
    picture.appendChild(source);
  });

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  picture.appendChild(img);

  return picture;
}

export function normalizeImageReferenceLinks(column, createPicture, options = {}) {
  if (!column?.querySelectorAll || typeof createPicture !== 'function') return;

  const links = [...column.querySelectorAll('a')];
  const imageLinks = links.filter((link) => {
    const href = link?.href || '';
    return href && !isVideoMediaUrl(href);
  });

  if (options.dynamicMedia) {
    imageLinks.forEach((link, index) => {
      if (index === 0) {
        link.replaceWith(createDynamicMediaPicture(link.href, link.textContent?.trim?.() || ''));
        return;
      }

      link.closest?.('p')?.remove?.();
    });
    return;
  }

  imageLinks.filter((link) => !link.querySelector?.('picture, img')).forEach((link) => {
    const href = link?.href || '';

    const picture = createPicture(href, link.textContent?.trim?.() || '', false);
    link.replaceWith(picture);
  });
}
