import { getHybrisBffBaseUrl as getEnvironmentHybrisBffBaseUrl } from './environment.js';
import { getLocaleFromPath } from './locale-utils.js';

const HYBRIS_SESSION_TOKEN_KEY = 'hybrisSessionToken';

const DEFAULT_AUTH_STATE = {
  authenticated: false,
  country: '',
  language: '',
  myAccountUrl: '',
  expiresAt: 0,
  guestCartCodePresent: false,
};

let sessionToken = '';
let authState = { ...DEFAULT_AUTH_STATE };
let authStatusPromise = null;
let authInitializationPromise = null;
const productCache = new Map();

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function readSessionToken() {
  try {
    return sessionStorage.getItem(HYBRIS_SESSION_TOKEN_KEY) || '';
  } catch (error) {
    return '';
  }
}

function syncWindowAuthState() {
  if (typeof window !== 'undefined') {
    window.HYBRIS_AUTH_STATE = { ...authState };
  }
}

function getCachedAuthState() {
  return { ...authState };
}

function resolveHybrisBffBaseUrl() {
  if (typeof window === 'undefined') {
    return '/api/hybris';
  }

  const configuredBase = trimTrailingSlash(window.HYBRIS_BFF_BASE_URL);
  if (configuredBase) {
    return configuredBase;
  }

  return trimTrailingSlash(getEnvironmentHybrisBffBaseUrl());
}

function resolveHybrisReturnUrl(returnUrl = (typeof window !== 'undefined' ? window.location.href : '/')) {
  if (typeof window === 'undefined') {
    return returnUrl || '/';
  }

  const currentPageUrl = String(window.location.href || '').trim();
  if (!currentPageUrl) {
    return returnUrl || '/';
  }

  try {
    return new URL(currentPageUrl).toString();
  } catch (error) {
    return currentPageUrl;
  }
}

function buildHybrisLoginUrl(returnUrl = (typeof window !== 'undefined' ? window.location.href : '/'), loginUrl = '') {
  if (typeof window === 'undefined') {
    return null;
  }

  const { country, language } = getLocaleFromPath();
  const nextLoginUrl = loginUrl
    ? new URL(loginUrl, window.location.href)
    : new URL(`${trimTrailingSlash(resolveHybrisBffBaseUrl())}/auth/login`);
  nextLoginUrl.searchParams.set('country', country || 'us');
  nextLoginUrl.searchParams.set('language', language || 'en');
  nextLoginUrl.searchParams.set('returnUrl', resolveHybrisReturnUrl(returnUrl));

  return nextLoginUrl;
}

function redirectToHybrisLogin(returnUrl = (typeof window !== 'undefined' ? window.location.href : '/'), loginUrl = '') {
  if (typeof window === 'undefined') {
    return;
  }

  const nextLoginUrl = buildHybrisLoginUrl(returnUrl, loginUrl);
  if (!nextLoginUrl) {
    return;
  }

  window.location.assign(nextLoginUrl.toString());
}

function resetAuthState() {
  authState = { ...DEFAULT_AUTH_STATE };
  authStatusPromise = null;
  syncWindowAuthState();
  return getCachedAuthState();
}

function setAuthState(nextState = {}) {
  authState = {
    ...DEFAULT_AUTH_STATE,
    ...nextState,
    authenticated: Boolean(nextState.authenticated),
  };
  authStatusPromise = null;
  syncWindowAuthState();
  return getCachedAuthState();
}

function clearSessionToken() {
  sessionToken = '';
  try {
    sessionStorage.removeItem(HYBRIS_SESSION_TOKEN_KEY);
  } catch (error) {
    // ignore storage failures
  }
  resetAuthState();
}

function saveSessionToken(nextToken) {
  if (!nextToken) {
    return;
  }

  sessionToken = nextToken;
  try {
    sessionStorage.setItem(HYBRIS_SESSION_TOKEN_KEY, nextToken);
  } catch (error) {
    // ignore storage failures
  }
}

function ensureSessionTokenLoaded() {
  if (!sessionToken) {
    sessionToken = readSessionToken();
  }
  return sessionToken;
}

function buildBffError(message, options = {}) {
  const error = new Error(message);
  error.status = options.status || 0;
  error.errorCode = options.errorCode || '';
  error.loginUrl = options.loginUrl || '';
  error.payload = options.payload;
  return error;
}

function getCleanLocationUrl() {
  if (typeof window === 'undefined') {
    return '/';
  }

  const url = new URL(window.location.href);
  ['code', 'lt', 'state', 'error', 'error_description'].forEach((key) => {
    url.searchParams.delete(key);
  });

  return `${url.pathname}${url.search}${url.hash}`;
}

function buildRegionParams(countryOverride, languageOverride) {
  const { country, language } = getLocaleFromPath();
  return {
    country: countryOverride || country || 'us',
    language: languageOverride || language || 'en',
  };
}

function buildBffUrl(path, query = {}) {
  const base = trimTrailingSlash(resolveHybrisBffBaseUrl());
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

function updateTokenFromResponse(response) {
  const rotated = response.headers.get('X-Hybris-Session-Token');
  if (rotated) {
    saveSessionToken(rotated);
  }
}

function handleAuthFailure(error, shouldRedirect, fallbackReturnUrl) {
  if (shouldRedirect && typeof window !== 'undefined') {
    if (error.loginUrl) {
      redirectToHybrisLogin(fallbackReturnUrl, error.loginUrl);
    } else {
      redirectToHybrisLogin(fallbackReturnUrl);
    }
  }

  throw error;
}

export function getHybrisBffBaseUrl() {
  return resolveHybrisBffBaseUrl();
}

export function getCachedHybrisAuthState() {
  return getCachedAuthState();
}

export function getHybrisSessionToken() {
  return ensureSessionTokenLoaded();
}

export function isHybrisAuthenticated() {
  return Boolean(getCachedHybrisAuthState().authenticated && ensureSessionTokenLoaded());
}

export function getHybrisProductCode(product = {}) {
  return product.code
    || product.sku
    || product.productCode
    || product.materialNumber
    || product.overseasModel
    || '';
}

export function startHybrisLogin(returnUrl = (typeof window !== 'undefined' ? window.location.href : '/')) {
  redirectToHybrisLogin(returnUrl);
}

export function scheduleHybrisTask(task) {
  return new Promise((resolve, reject) => {
    const execute = () => {
      Promise.resolve()
        .then(task)
        .then(resolve)
        .catch(reject);
    };

    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
      window.setTimeout(execute, 0);
      return;
    }

    execute();
  });
}

export async function exchangeHybrisCodeIfPresent() {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const lt = url.searchParams.get('lt');

  if (!code || !lt) {
    return null;
  }

  const response = await fetch(buildBffUrl('/auth/exchange'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, lt }),
  });

  const json = await parseJsonSafely(response);
  updateTokenFromResponse(response);

  if (!response.ok || json?.success === false) {
    clearSessionToken();
    throw buildBffError(json?.message || 'Auth exchange failed', {
      status: response.status,
      errorCode: json?.errorCode,
      loginUrl: json?.loginUrl,
      payload: json,
    });
  }

  const exchanged = json?.data || null;
  saveSessionToken(exchanged?.sessionToken);
  if (exchanged?.authenticated) {
    setAuthState(exchanged);
  }

  const cleanUrl = exchanged?.returnUrl || getCleanLocationUrl();
  window.history.replaceState({}, '', cleanUrl);

  return exchanged;
}

export async function bffRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers,
    auth = 'optional',
    redirectOnAuthFailure = false,
    returnUrl,
    query,
    retryOptionalAuth = true,
  } = options;

  const token = ensureSessionTokenLoaded();
  const requestHeaders = new Headers(headers || {});
  const shouldSendJson = body !== undefined && body !== null;

  if (shouldSendJson && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth !== 'none' && token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildBffUrl(path, query), {
    method,
    headers: requestHeaders,
    body: shouldSendJson && typeof body !== 'string' ? JSON.stringify(body) : body,
  });

  const json = await parseJsonSafely(response);
  updateTokenFromResponse(response);

  if (response.status === 401 || json?.errorCode === 'AUTH_REQUIRED') {
    const hadToken = Boolean(token);
    clearSessionToken();

    if (auth === 'optional' && hadToken && retryOptionalAuth) {
      return bffRequest(path, {
        ...options,
        auth: 'none',
        retryOptionalAuth: false,
      });
    }

    const authError = buildBffError(json?.message || 'Authentication required', {
      status: response.status,
      errorCode: json?.errorCode || 'AUTH_REQUIRED',
      loginUrl: json?.loginUrl,
      payload: json,
    });

    return handleAuthFailure(authError, redirectOnAuthFailure, returnUrl);
  }

  if (!response.ok || json?.success === false) {
    throw buildBffError(json?.message || `BFF request failed: ${response.status}`, {
      status: response.status,
      errorCode: json?.errorCode,
      loginUrl: json?.loginUrl,
      payload: json,
    });
  }

  return json?.data;
}

export async function refreshHybrisAuthStatus(options = {}) {
  const { force = false } = options;

  ensureSessionTokenLoaded();
  if (!sessionToken) {
    return resetAuthState();
  }

  if (!force && authState.authenticated && authState.expiresAt) {
    return getCachedHybrisAuthState();
  }

  if (!force && authStatusPromise) {
    return authStatusPromise;
  }

  const { country, language } = buildRegionParams();

  authStatusPromise = bffRequest('/auth/status', {
    auth: 'optional',
    query: {
      country,
      language,
    },
  })
    .then((status) => setAuthState(status))
    .catch((error) => {
      if (error.errorCode === 'AUTH_REQUIRED' || error.status === 401) {
        return resetAuthState();
      }
      throw error;
    })
    .finally(() => {
      authStatusPromise = null;
    });

  return authStatusPromise;
}

export function initializeHybrisAuth(options = {}) {
  const { force = false } = options;

  if (!force && authInitializationPromise) {
    return authInitializationPromise;
  }

  authInitializationPromise = (async () => {
    ensureSessionTokenLoaded();

    try {
      await exchangeHybrisCodeIfPresent();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Hybris auth exchange failed', error);
    }

    try {
      return await refreshHybrisAuthStatus({ force: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Hybris auth status check failed', error);
      return getCachedHybrisAuthState();
    }
  })();

  return authInitializationPromise;
}

export async function fetchHybrisProduct(code, options = {}) {
  const normalizedCode = String(code || '').trim();
  if (!normalizedCode) {
    return null;
  }

  ensureSessionTokenLoaded();
  const cacheKey = normalizedCode;
  if (!options.force && productCache.has(cacheKey)) {
    return productCache.get(cacheKey);
  }

  const { country, language } = buildRegionParams();
  const product = await bffRequest('/product', {
    auth: 'optional',
    query: {
      country,
      language,
      code: normalizedCode,
    },
  });

  productCache.set(cacheKey, product);
  return product;
}

export async function fetchHybrisWishlist(options = {}) {
  const { country, language } = buildRegionParams();
  try {
    return await bffRequest('/wishlist', {
      auth: 'required',
      query: {
        country,
        language,
      },
      redirectOnAuthFailure: options.redirectOnAuthFailure === true,
      returnUrl: options.returnUrl,
    });
  } catch (error) {
    if (error.status === 404 || error.errorCode === 'WISHLIST_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

export async function addHybrisCartItem(code, quantity = 1, options = {}) {
  const { country, language } = buildRegionParams();
  return bffRequest('/cart/items', {
    method: 'POST',
    auth: 'required',
    body: {
      code,
      quantity,
    },
    query: {
      country,
      language,
    },
    redirectOnAuthFailure: options.redirectOnAuthFailure === true,
    returnUrl: options.returnUrl,
  });
}

export async function addHybrisWishlistItem(code, quantity = 1, options = {}) {
  const cartCode = String(options.cartCode || '').trim();
  if (!cartCode) {
    throw buildBffError('Wishlist cartCode is required', {
      status: 0,
      errorCode: 'INVALID_REQUEST',
    });
  }

  const { country, language } = buildRegionParams();
  return bffRequest('/wishlist/items', {
    method: 'POST',
    auth: 'required',
    body: {
      cartCode,
      code,
      quantity,
    },
    query: {
      country,
      language,
    },
    redirectOnAuthFailure: options.redirectOnAuthFailure === true,
    returnUrl: options.returnUrl,
  });
}

export async function removeHybrisWishlistItem(entryNumber, options = {}) {
  const cartCode = String(options.cartCode || '').trim();
  if (!cartCode) {
    throw buildBffError('Wishlist cartCode is required', {
      status: 0,
      errorCode: 'INVALID_REQUEST',
    });
  }

  const { country, language } = buildRegionParams();
  return bffRequest(`/wishlist/items/${encodeURIComponent(entryNumber)}`, {
    method: 'DELETE',
    auth: 'required',
    query: {
      cartCode,
      country,
      language,
    },
    redirectOnAuthFailure: options.redirectOnAuthFailure === true,
    returnUrl: options.returnUrl,
  });
}

sessionToken = readSessionToken();
syncWindowAuthState();
