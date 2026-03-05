export function getLocaleFromPath() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const segments = pathname.split('/').filter(Boolean);

  const isContentPath = segments[0] === 'content';
  const countryIndex = isContentPath ? 2 : 0;
  const languageIndex = isContentPath ? 3 : 1;

  const country = (segments[countryIndex] || 'us').toLowerCase();
  const language = country === 'us'
    ? 'en'
    : (segments[languageIndex] || 'en').toLowerCase();

  return { country, language };
}

export function getFragmentPath(fragmentName) {
  const base = (typeof window !== 'undefined' && window.hlx?.codeBasePath) ? window.hlx.codeBasePath : '';
  const { country, language } = getLocaleFromPath();

  const localeSegment = (country === 'us' && language === 'en')
    ? `us/${fragmentName}`
    : `${country}/${language}/${fragmentName}`;

  return `${base}/${localeSegment}`;
}
