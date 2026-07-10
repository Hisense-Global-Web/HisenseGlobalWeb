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
