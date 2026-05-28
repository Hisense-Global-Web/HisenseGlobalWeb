import { getLocaleFromPath, localizeProductApiPath } from '../../scripts/locale-utils.js';
import { formatIsoToUtcStr } from '../../utils/carousel-common.js';

const { language } = getLocaleFromPath();
function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}
/**
 * Get GraphQL endpoint URL with base URL
 */
function getGraphQLUrl(endpointPath) {
  let path = localizeProductApiPath(endpointPath);
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
  const isAemEnv = hostname.includes('author') || hostname.includes('publish');

  if (isAemEnv && path && path.endsWith('.json')) {
    let pathWithoutJson = path.replace(/\.json$/, '');
    pathWithoutJson = pathWithoutJson.replace(/^\/product\/?/, '/') || '/';
    path = `/bin/hisense/productList.json?path=${pathWithoutJson}`;
  }

  const baseUrl = window.GRAPHQL_BASE_URL || '';
  let url;
  if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
    url = path;
  } else {
    url = baseUrl ? `${baseUrl}${path}` : path;
  }
  const fiveMinutesMs = 5 * 60 * 1000;
  const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
  const sep = url.indexOf('?') >= 0 ? '&' : '?';
  return `${url}${sep}_t=${cacheBuster}`;
}

/**
 * 新的 GraphQL 返回结构转换为现有可用的结构
 */
function transformTagStructureToProducts(tagData) {
  if (!tagData) return [];

  if (Array.isArray(tagData)) {
    return tagData;
  }

  if (tagData.data && Array.isArray(tagData.data)) {
    return tagData.data;
  }

  if (tagData.data && tagData.data.jobsList && Array.isArray(tagData.data.jobsList.items)) {
    return tagData.data.jobsList.items;
  }

  return [];
}

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
export default function decorate(block) {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedPath = urlParams.get('path');
  const originalPath = decodeURIComponent(encodedPath);
  let graphqlUrl = null;
  let currentItem = null;

  const rows = [...(block.children || [])];
  rows.forEach((row, index) => {
    const anchor = row.querySelector && row.querySelector('a');
    if (index === 0) {
      graphqlUrl = anchor.getAttribute('href') || anchor.textContent.trim();
    }
    row.style.display = 'none';
  });

  const renderItem = (item) => {
    const jobTitle = document.createElement('div');
    jobTitle.classList.add('job-title');
    const titleContent = document.createElement('div');
    titleContent.classList.add('title-content');
    titleContent.textContent = item.jobType;
    const subtitleContent = document.createElement('div');
    subtitleContent.classList.add('subtitle-content');
    subtitleContent.textContent = item.jobTitle;
    const articleMetaGroup = document.createElement('div');
    articleMetaGroup.classList.add('article-meta-group');
    const articleDateGroup = document.createElement('div');
    articleDateGroup.classList.add('article-date');
    const dateIconEl = document.createElement('img');
    dateIconEl.src = `/content/dam/hisense/${country}/common-icons/time.svg`;
    const dateEl = document.createElement('span');
    dateEl.textContent = formatIsoToUtcStr(item.jobPostedTime, language);
    articleDateGroup.append(dateIconEl, dateEl);
    const lineEl = document.createElement('div');
    lineEl.className = 'mate-line';
    const articleLocationGroup = document.createElement('div');
    articleLocationGroup.classList.add('article-date');
    const locationIconEl = document.createElement('img');
    locationIconEl.src = `/content/dam/hisense/${country}/common-icons/address.svg`;
    const locationEl = document.createElement('span');
    locationEl.textContent = item.workLocation;
    articleLocationGroup.append(locationIconEl, locationEl);
    articleMetaGroup.append(articleDateGroup, lineEl, articleLocationGroup);
    jobTitle.append(titleContent, subtitleContent, articleMetaGroup);
    // job detail rich text start
    const jobRichTextEl = document.createElement('div');
    jobRichTextEl.classList.add('job-rich-text');
    jobRichTextEl.innerHTML = item.description?.html;
    // job detail key facts list start
    const keyFactsEl = document.createElement('div');
    keyFactsEl.classList.add('key-facts-list');
    const keyFactsTitleEl = document.createElement('div');
    keyFactsTitleEl.className = 'article-title-list-title';
    keyFactsTitleEl.textContent = 'Key Information';
    const keyFactsListEl = document.createElement('div');
    keyFactsListEl.className = 'article-body-list';

    const keyFactsItem1El = document.createElement('div');
    keyFactsItem1El.classList.add('article-body-list-item');
    const keyFactsTitle1El = document.createElement('div');
    keyFactsTitle1El.classList.add('article-body-list-item-title');
    keyFactsTitle1El.textContent = 'Job Title';
    const keyFactsValue1El = document.createElement('div');
    keyFactsValue1El.classList.add('article-body-list-item-headline');
    keyFactsValue1El.textContent = item.jobTitle;
    keyFactsItem1El.append(keyFactsTitle1El, keyFactsValue1El);

    const keyFactsItem2El = document.createElement('div');
    keyFactsItem2El.classList.add('article-body-list-item');
    const keyFactsTitle2El = document.createElement('div');
    keyFactsTitle2El.classList.add('article-body-list-item-title');
    keyFactsTitle2El.textContent = 'Work Location';
    const keyFactsValue2El = document.createElement('div');
    keyFactsValue2El.classList.add('article-body-list-item-headline');
    keyFactsValue2El.textContent = item.workLocation;
    keyFactsItem2El.append(keyFactsTitle2El, keyFactsValue2El);

    const keyFactsItem3El = document.createElement('div');
    keyFactsItem3El.classList.add('article-body-list-item');
    const keyFactsTitle3El = document.createElement('div');
    keyFactsTitle3El.classList.add('article-body-list-item-title');
    keyFactsTitle3El.textContent = 'Job Types';
    const keyFactsValue3El = document.createElement('div');
    keyFactsValue3El.classList.add('article-body-list-item-headline');
    keyFactsValue3El.textContent = item.jobType;
    keyFactsItem3El.append(keyFactsTitle3El, keyFactsValue3El);

    keyFactsListEl.append(keyFactsItem1El, keyFactsItem2El, keyFactsItem3El);
    keyFactsEl.append(keyFactsTitleEl, keyFactsListEl);
    block.append(jobTitle, jobRichTextEl, keyFactsEl);
  };

  fetch(getGraphQLUrl(graphqlUrl))
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      // 转换新的标签结构为产品列表格式
      const items = transformTagStructureToProducts(data);
      // eslint-disable-next-line no-underscore-dangle
      currentItem = items.find((item) => item._path === originalPath);
      if (currentItem) {
        renderItem(currentItem);
      }
    })
    .catch(() => { });
}
