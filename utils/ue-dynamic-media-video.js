const HISENSE_DAM_PREFIX = '/content/dam/hisense';
const MP4_EXTENSION_PATTERN = /\.mp4(?:[?#].*)?$/i;

function getDefaultLocation() {
  return typeof window !== 'undefined' ? window.location : undefined;
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

function replaceTextValue(value, assetPath, hlsUrl) {
  if (typeof value !== 'string') return value;

  return value.split(assetPath).join(hlsUrl);
}

function rewritePatchValue(patch, assetPath, hlsUrl) {
  if (!patch) return false;

  if (Array.isArray(patch)) {
    return patch.reduce((patched, entry) => rewritePatchValue(entry, assetPath, hlsUrl) || patched, false);
  }

  if (typeof patch.value !== 'string') return false;

  const nextValue = replaceTextValue(patch.value, assetPath, hlsUrl);
  if (nextValue === patch.value) return false;

  patch.value = nextValue;
  return true;
}

function rewriteResponseContent(detail, assetPath, hlsUrl) {
  const updates = detail?.response?.updates;
  if (!Array.isArray(updates)) return false;

  return updates.reduce((patched, update) => {
    if (typeof update?.content !== 'string') return patched;

    const nextContent = replaceTextValue(update.content, assetPath, hlsUrl);
    if (nextContent === update.content) return patched;

    update.content = nextContent;
    return true;
  }, false);
}

function rewriteEventValue(event, assetPath, hlsUrl) {
  const { detail } = event || {};
  const patchPatched = rewritePatchValue(detail?.patch, assetPath, hlsUrl)
    || rewritePatchValue(detail?.request?.patch, assetPath, hlsUrl);
  const responsePatched = rewriteResponseContent(detail, assetPath, hlsUrl);

  return patchPatched || responsePatched;
}

function getDefaultParentDocument() {
  try {
    if (typeof window === 'undefined' || !window.parent || window.parent === window) return null;

    return window.parent.document;
  } catch (error) {
    return null;
  }
}

function findEditorInput(parentDocument, oldValue) {
  const fields = [...(parentDocument?.querySelectorAll?.('input, textarea') || [])];

  return fields.find((field) => field.value === oldValue || field.getAttribute?.('value') === oldValue);
}

function setEditorInputValue(input, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(input?.constructor?.prototype || {}, 'value')?.set;
  if (valueSetter) {
    valueSetter.call(input, value);
    return;
  }

  input.value = value;
}

function createEditorEvent(type, value, options = {}) {
  const win = typeof window !== 'undefined' ? window : undefined;
  const EventConstructor = options.EventConstructor || win?.Event;
  const InputEventConstructor = options.InputEventConstructor || win?.InputEvent || EventConstructor;

  if (type === 'input' && InputEventConstructor) {
    try {
      return new InputEventConstructor(type, {
        bubbles: true,
        inputType: 'insertReplacementText',
        data: value,
      });
    } catch (error) {
      // Fall through to Event for browsers that expose InputEvent but reject constructor options.
    }
  }

  return new EventConstructor(type, { bubbles: true });
}

function updateParentEditorInput(oldValue, newValue, options = {}) {
  if (!oldValue || !newValue || oldValue === newValue) return false;

  const parentDocument = options.parentDocument || getDefaultParentDocument();
  const input = findEditorInput(parentDocument, oldValue);
  const win = typeof window !== 'undefined' ? window : undefined;
  const EventConstructor = options.EventConstructor || win?.Event;
  if (!input || !EventConstructor) return false;

  setEditorInputValue(input, newValue);
  input.dispatchEvent(createEditorEvent('input', newValue, options));
  input.dispatchEvent(createEditorEvent('change', newValue, options));
  input.dispatchEvent(createEditorEvent('blur', newValue, options));

  return true;
}

async function applyDynamicMediaVideoPatch(event, options = {}) {
  const assetPath = getPatchValue(event);
  if (!isHisenseMp4AssetPath(assetPath)) return false;

  const repositoryAsset = options.repositoryAsset || await fetchRepositoryAsset(assetPath, options);
  const assetId = repositoryAsset?.['repo:id'] || repositoryAsset?.['repo:assetId'];
  const hlsUrl = buildDynamicMediaHlsUrl(assetId, options);
  if (!hlsUrl) return false;

  const patched = rewriteEventValue(event, assetPath, hlsUrl);
  const editorInputPatched = updateParentEditorInput(assetPath, hlsUrl, options);

  return {
    assetPath,
    editorInputPatched,
    hlsUrl,
    patched,
  };
}

export {
  applyDynamicMediaVideoPatch,
  buildDynamicMediaHlsUrl,
  buildRepositoryAssetUrl,
  isHisenseMp4AssetPath,
  updateParentEditorInput,
};
