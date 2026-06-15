import { setVideoSource as setHlsVideoSource } from './hls-video.js';

const HISENSE_DAM_PREFIX = '/content/dam/hisense';
const MP4_EXTENSION_PATTERN = /\.mp4(?:[?#].*)?$/i;

function getDefaultLocation() {
  return typeof window !== 'undefined' ? window.location : undefined;
}

function getDefaultDocument() {
  return typeof document !== 'undefined' ? document : undefined;
}

function getDefaultFetch() {
  if (typeof fetch !== 'function') return undefined;

  return fetch.bind(typeof window !== 'undefined' ? window : undefined);
}

function getPatchValue(event) {
  const { patch } = event?.detail || {};
  if (Array.isArray(patch)) {
    return patch.find((entry) => typeof entry?.value === 'string')?.value;
  }

  return patch?.value;
}

function isHisenseMp4AssetPath(value) {
  if (typeof value !== 'string') return false;

  const assetPath = value.trim();
  return assetPath.startsWith(HISENSE_DAM_PREFIX) && MP4_EXTENSION_PATTERN.test(assetPath);
}

function encodePath(assetPath) {
  return assetPath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function getOriginFromLocation(locationLike) {
  if (!locationLike) return '';
  if (typeof locationLike === 'string') return new URL(locationLike).origin;
  if (locationLike.origin) return locationLike.origin;
  if (locationLike.href) return new URL(locationLike.href).origin;
  return '';
}

function getAuthorOrigin(options = {}) {
  if (options.authorOrigin) {
    return new URL(options.authorOrigin).origin;
  }

  const systemReference = options.document
    ?.querySelector?.('meta[name="urn:adobe:aue:system:reference"]')
    ?.content;
  if (systemReference) {
    return new URL(systemReference).origin;
  }

  return getOriginFromLocation(options.location || getDefaultLocation());
}

function buildRepositoryAssetUrl(assetPath, options = {}) {
  const authorOrigin = getAuthorOrigin(options);
  if (!authorOrigin) return '';

  return `${authorOrigin}/adobe/repository${encodePath(assetPath)}`;
}

function buildDeliveryOrigin(authorOrigin) {
  const deliveryUrl = new URL(authorOrigin);
  deliveryUrl.hostname = deliveryUrl.hostname
    .replace(/^author-/i, 'delivery-')
    .replace(/^publish-/i, 'delivery-');
  return deliveryUrl.origin;
}

function normalizeAssetId(assetId = '') {
  const trimmedAssetId = String(assetId || '').trim();
  if (!trimmedAssetId) return '';

  return trimmedAssetId.startsWith('urn:') ? trimmedAssetId : `urn:aaid:aem:${trimmedAssetId}`;
}

function buildDynamicMediaHlsUrl(assetId, options = {}) {
  const authorOrigin = getAuthorOrigin(options);
  const normalizedAssetId = normalizeAssetId(assetId);
  if (!authorOrigin || !normalizedAssetId) return '';

  return `${buildDeliveryOrigin(authorOrigin)}/adobe/assets/${normalizedAssetId}/manifest.m3u8`;
}

async function fetchRepositoryAsset(assetPath, options = {}) {
  const fetchFn = options.fetch || getDefaultFetch();
  const repositoryUrl = buildRepositoryAssetUrl(assetPath, options);
  if (!fetchFn || !repositoryUrl) return null;

  const response = await fetchFn(repositoryUrl, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });
  if (!response?.ok) return null;

  return response.json();
}

function getElementSrc(element) {
  return element?.getAttribute?.('src') || element?.src || '';
}

function sourceMatchesAssetPath(src, assetPath, locationLike) {
  if (!src) return false;

  try {
    const locationHref = locationLike?.href || String(locationLike || 'http://localhost/');
    return decodeURIComponent(new URL(src, locationHref).pathname) === assetPath;
  } catch (error) {
    return src === assetPath;
  }
}

function findVideosForAsset(assetPath, options = {}) {
  const root = options.root || getDefaultDocument();
  const locationLike = options.location || getDefaultLocation();
  if (!root?.querySelectorAll) return [];

  const videos = new Set();
  root.querySelectorAll('video').forEach((video) => {
    if (sourceMatchesAssetPath(getElementSrc(video), assetPath, locationLike)) {
      videos.add(video);
    }

    video.querySelectorAll?.('source').forEach((source) => {
      if (sourceMatchesAssetPath(getElementSrc(source), assetPath, locationLike)) {
        videos.add(video);
      }
    });
  });

  return [...videos];
}

async function applyDynamicMediaVideoPatch(event, options = {}) {
  const assetPath = getPatchValue(event);
  if (!isHisenseMp4AssetPath(assetPath)) return false;

  const repositoryAsset = options.repositoryAsset || await fetchRepositoryAsset(assetPath, options);
  const assetId = repositoryAsset?.['repo:id'] || repositoryAsset?.['repo:assetId'];
  const hlsUrl = buildDynamicMediaHlsUrl(assetId, options);
  if (!hlsUrl) return false;

  const videos = findVideosForAsset(assetPath, options);
  const setVideoSource = options.setVideoSource || setHlsVideoSource;
  await Promise.all(videos.map((video) => setVideoSource(video, hlsUrl)));

  return {
    assetPath,
    hlsUrl,
    videoCount: videos.length,
  };
}

export {
  applyDynamicMediaVideoPatch,
  buildDynamicMediaHlsUrl,
  buildRepositoryAssetUrl,
  isHisenseMp4AssetPath,
};
