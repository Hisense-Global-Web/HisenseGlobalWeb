import {
  isDeliveryDynamicMediaUrl,
  isDeliveryDynamicMediaVideoUrl,
} from '../../utils/dynamic-media.js';

const VIDEO_MEDIA_EXTENSIONS = new Set([
  'mp4',
  'webm',
  'mov',
  'm4v',
  'm3u8',
  'ogv',
]);

const HERO_BANNER_DYNAMIC_MEDIA_CROPS = [
  { cropName: 'Small', cropWidth: 639 },
  { cropName: 'Medium', cropWidth: 1179 },
  { cropName: 'Large', cropWidth: 1920 },
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

function buildSmartCropUrl(src, cropName, cropWidth, currentLocationHref = getCurrentLocationHref()) {
  if (!src || !cropName) return '';

  const assetUrl = new URL(src, currentLocationHref);
  const currentUrl = new URL(currentLocationHref);

  assetUrl.search = '';
  assetUrl.searchParams.set('smartcrop', String(cropName).trim());
  if (cropWidth) {
    assetUrl.searchParams.set('width', String(cropWidth));
  }
  assetUrl.hash = '';

  if (assetUrl.origin === currentUrl.origin) {
    return `${assetUrl.pathname}${assetUrl.search}`;
  }

  return assetUrl.toString();
}

function getLargeSmartCropUrl(src) {
  const largeCrop = HERO_BANNER_DYNAMIC_MEDIA_CROPS[HERO_BANNER_DYNAMIC_MEDIA_CROPS.length - 1];
  return buildSmartCropUrl(src, largeCrop.cropName, largeCrop.cropWidth);
}

export function isVideoMediaUrl(assetUrl = '') {
  return isDeliveryDynamicMediaVideoUrl(assetUrl)
    || VIDEO_MEDIA_EXTENSIONS.has(getAssetExtension(assetUrl));
}

export function isVideoMediaColumn(column) {
  const links = [...(column?.querySelectorAll?.('a') || [])]
    .filter((link) => link?.href);

  return links.length > 0 && links.every((link) => isVideoMediaUrl(link.href));
}

export function buildHeroBannerDynamicMediaSources(src, currentLocationHref = getCurrentLocationHref()) {
  return HERO_BANNER_DYNAMIC_MEDIA_CROPS.map(({ cropName, cropWidth }) => ({
    media: `(max-width: ${cropWidth}px)`,
    srcset: buildSmartCropUrl(src, cropName, cropWidth, currentLocationHref),
    width: String(cropWidth),
  }));
}

export function createDynamicMediaPicture(src, alt = '') {
  const picture = document.createElement('picture');

  buildHeroBannerDynamicMediaSources(src).forEach((sourceConfig) => {
    const source = document.createElement('source');
    source.setAttribute('media', sourceConfig.media);
    source.setAttribute('srcset', sourceConfig.srcset);
    source.setAttribute('width', sourceConfig.width);
    picture.appendChild(source);
  });

  const img = document.createElement('img');
  img.src = getLargeSmartCropUrl(src);
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

  if (options.dynamicMedia || imageLinks.some((link) => isDeliveryDynamicMediaUrl(link.href))) {
    column.classList?.add?.('dynamic-media-enabled');
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

// 判断imageEl是否是a链接，如果是就创建一个Dyanmic Media Picture，否则返回原来的元素
export const checkDyanmicMediaImage = (imageEl, alt = 'A Dinamic Media Image') => {
  if (imageEl.querySelector('a')) {
    const dynamicImageUrl = imageEl.querySelector('a').href;
    const dynamicImageEl = createDynamicMediaPicture(dynamicImageUrl, alt);
    imageEl?.remove();
    return dynamicImageEl;
  }
  return imageEl;
};
