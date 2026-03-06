import { getLocaleFromPath } from './locale-utils.js';

function getTagRoot(tagData) {
  if (!tagData) return null;
  if (Array.isArray(tagData.data) && tagData.data.length > 0) return tagData.data[0];
  return tagData;
}

function getTagPathParts(tagPath) {
  return String(tagPath || '').split(':').pop().split('/').filter(Boolean);
}

function getLocaleTitleKeys(locale = getLocaleFromPath()) {
  const language = String(locale?.language || '').toLowerCase();

  const keys = new Set();

  if (language) {
    keys.add(`jcr:title.${language}`);
  }

  keys.add('jcr:title');

  return [...keys];
}

export function getLocalizedTagTitleValue(tagNode, locale = getLocaleFromPath()) {
  if (!tagNode || typeof tagNode !== 'object') return '';

  const titleKey = getLocaleTitleKeys(locale).find((key) => {
    const value = tagNode[key];
    return typeof value === 'string' && value.trim();
  });

  return titleKey ? tagNode[titleKey].trim() : '';
}

export function getLocalizedTagTitle(tagPath, tagData, locale = getLocaleFromPath()) {
  const pathParts = getTagPathParts(tagPath);
  const fallback = pathParts[pathParts.length - 1] || String(tagPath || '');
  const tagRoot = getTagRoot(tagData);

  if (!tagRoot) return fallback;

  const resolvePath = (parts) => parts.reduce((current, part) => {
    if (current && typeof current === 'object' && current[part]) return current[part];
    return null;
  }, tagRoot);

  const directResult = resolvePath(pathParts);
  const result = directResult || (pathParts.length > 1 ? resolvePath(pathParts.slice(1)) : null);
  const localizedTitle = getLocalizedTagTitleValue(result, locale);

  return localizedTitle || fallback;
}

export function buildLocalizedTagTitleMap(tagData, locale = getLocaleFromPath()) {
  const titleMap = {};

  function collectTitles(node) {
    if (!node || typeof node !== 'object') return;

    Object.keys(node).forEach((key) => {
      if (key.startsWith('jcr:') || key === 'sling:resourceType' || key === 'jcr:primaryType') return;

      const value = node[key];
      if (value && typeof value === 'object') {
        const normalizedKey = key.trim();
        const localizedTitle = getLocalizedTagTitleValue(value, locale);
        if (localizedTitle) {
          titleMap[normalizedKey] = localizedTitle;
        }
        collectTitles(value);
      }
    });
  }

  collectTitles(getTagRoot(tagData));

  return titleMap;
}
