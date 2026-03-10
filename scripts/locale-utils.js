/**
 * hisense.com/us 没有 en 这一级目录，US 站点统一默认语言为 en（不从 path 取语言）。
 */
export function getLocaleFromPath() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const segments = pathname.split('/').filter(Boolean);

  const isContentPath = segments[0] === 'content';
  const countryIndex = isContentPath ? 2 : 0;
  const languageIndex = isContentPath ? 3 : 1;

  const country = (segments[countryIndex] || 'us').toLowerCase();
  // US 站点无 /en 层级，固定 language=en, 其他从 path 取或默认 en
  const language = (country === 'us')
    ? 'en'
    : ((segments[languageIndex] || '').toLowerCase() || 'en');

  return { country, language };
}

export function getFragmentPath(fragmentName) {
  const base = (typeof window !== 'undefined' && window.hlx?.codeBasePath) ? window.hlx.codeBasePath : '';
  const { country, language } = getLocaleFromPath();

  const isHisenseCom = typeof window !== 'undefined' && window.location.href.includes('hisense.com');
  const isUsSite = country === 'us' && language === 'en';
  const localeSegment = (isHisenseCom && isUsSite)
    ? `us/${fragmentName}`
    : `${country}/${language}/${fragmentName}`;

  return `${base}/${localeSegment}`;
}

export function localizeProductApiPath(path) {
  if (!path || typeof path !== 'string') {
    return path;
  }

  const isAbsoluteUrl = /^https?:\/\//i.test(path);
  if (!isAbsoluteUrl && !path.startsWith('/')) {
    return path;
  }

  const url = new URL(path, window.location.origin);
  const { pathname, search, hash } = url;

  if (!pathname.startsWith('/product')) {
    return path;
  }

  const { country, language } = getLocaleFromPath();
  const matchedPath = pathname.match(/^\/product(?:\/(.*))?\.json$/i);
  if (!matchedPath) {
    return isAbsoluteUrl ? `${url.origin}${pathname}${search}${hash}` : `${pathname}${search}${hash}`;
  }

  const productPath = (matchedPath[1] || '').replace(/^\/+|\/+$/g, '');
  const pathParts = productPath ? productPath.split('/').filter(Boolean) : [];
  const hasLocalePrefix = pathParts.length >= 2
    && /^[a-z]{2}$/i.test(pathParts[0])
    && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(pathParts[1]);
  const resourceParts = hasLocalePrefix ? pathParts.slice(2) : pathParts;

  const localizedPath = `/product/${country}/${language}${resourceParts.length ? `/${resourceParts.join('/')}` : ''}.json`;
  const localizedUrl = `${localizedPath}${search}${hash}`;

  return isAbsoluteUrl ? `${url.origin}${localizedUrl}` : localizedUrl;
}
