import { createDynamicMediaPicture } from '../blocks/hero-banner/media-reference.js';

function getCurrentLocationHref() {
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }

  return 'http://localhost:3000/';
}

export function isDeliveryDynamicMediaUrl(assetUrl = '', currentLocationHref = getCurrentLocationHref()) {
  if (!assetUrl) return false;

  try {
    const url = new URL(assetUrl, currentLocationHref);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.startsWith('delivery');
  } catch (error) {
    return /^https?:\/\/delivery/i.test(String(assetUrl).trim());
  }
}

export function isDeliveryDynamicMediaVideoUrl(assetUrl = '', currentLocationHref = getCurrentLocationHref()) {
  if (!assetUrl) return false;

  const urlText = String(assetUrl).trim();

  try {
    const url = new URL(assetUrl, currentLocationHref);
    return isDeliveryDynamicMediaUrl(url.href, currentLocationHref)
      && (url.pathname.endsWith('/play') || url.pathname.endsWith('/manifest.m3u8'));
  } catch (error) {
    return /^https?:\/\/delivery/i.test(urlText)
      && (/\/play(?:[?#].*)?$/i.test(urlText) || /\/manifest\.m3u8(?:[?#].*)?$/i.test(urlText));
  }
}

export function toDynamicMediaVideoUrl(assetUrl = '', currentLocationHref = getCurrentLocationHref()) {
  if (!assetUrl) return '';

  const urlText = String(assetUrl).trim();

  try {
    const url = new URL(assetUrl, currentLocationHref);
    if (!isDeliveryDynamicMediaUrl(url.href, currentLocationHref) || !urlText.endsWith('/play')) {
      return assetUrl;
    }

    url.pathname = url.pathname.replace(/\/play$/, '/manifest.m3u8');
    return url.toString();
  } catch (error) {
    if (/^https?:\/\/delivery/i.test(urlText) && urlText.endsWith('/play')) {
      return urlText.replace(/\/play$/, '/manifest.m3u8');
    }

    return assetUrl;
  }
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
