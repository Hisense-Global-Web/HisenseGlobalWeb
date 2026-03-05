import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { getLocaleFromPath } from '../../scripts/locale-utils.js';

const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_TAGS_ENDPOINT = '/content/cq:tags/hisense.-1.json';

function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

function getTagsEndpointUrl() {
  const baseUrl = window.GRAPHQL_BASE_URL || '';
  return baseUrl ? `${baseUrl}${DEFAULT_TAGS_ENDPOINT}` : DEFAULT_TAGS_ENDPOINT;
}

// 获取标签数据
async function fetchTagData() {
  try {
    const response = await fetch(getTagsEndpointUrl());
    if (response.ok) return response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('search-result-module: failed to fetch tag data:', error);
  }
  return null;
}

function getTagRoot(tagData) {
  if (!tagData) return null;
  if (Array.isArray(tagData.data) && tagData.data.length > 0) return tagData.data[0];
  return tagData;
}

// 获取标签 jcr:title
function getTagTitle(tagPath, tagData) {
  const pathParts = tagPath.split(':').pop().split('/').filter(Boolean);
  const fallback = pathParts[pathParts.length - 1] || tagPath;
  const tagRoot = getTagRoot(tagData);

  if (!tagRoot) return fallback;

  const resolvePath = (parts) => parts.reduce((current, part) => {
    if (current && current[part]) return current[part];
    return null;
  }, tagRoot);

  const directResult = resolvePath(pathParts);
  const result = directResult || (pathParts.length > 1 ? resolvePath(pathParts.slice(1)) : null);

  return result?.['jcr:title'] || fallback;
}

// 根据 dataSource 拼接不同的域名 author 环境下 graphql 类型自动转 GraphQL 查询
function getEndpointUrl(endpointPath, dataSource) {
  let path = endpointPath;
  const hostname = window.location.hostname || '';
  const isAuthorEnv = hostname.includes('author-');
  const isGraphQL = dataSource === 'graphql';

  if (isAuthorEnv && isGraphQL && path && path.endsWith('.json')) {
    const pathWithoutJson = path.replace(/\.json$/, '');
    const graphqlPath = `/graphql/execute.json/global/GetProductByPath;path=/content/dam/hisense/content-fragments${pathWithoutJson}`;
    path = window.GRAPHQL_BASE_URL ? `${window.GRAPHQL_BASE_URL}${graphqlPath}` : graphqlPath;
  } else {
    const baseUrl = isGraphQL
      ? (window.GRAPHQL_BASE_URL || '')
      : (window.EDS_BASE_URL || window.location.origin);
    path = baseUrl ? `${baseUrl}${path}` : path;
  }

  const fiveMinutesMs = 5 * 60 * 1000;
  const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
  const sep = path.indexOf('?') >= 0 ? '&' : '?';
  return `${path}${sep}_t=${cacheBuster}`;
}

// 根据接口类型替换 endpoint 中的国家/语言段
// EDS: /{country}/{lang}/x.json
// GQL: /{prefix}/{country}/{lang}/... .json
function getLocalizedEndpoint(configEndpoint, dataSource) {
  const { country, language } = getLocaleFromPath();
  const segments = configEndpoint.split('/').filter(Boolean);

  if (dataSource === 'graphql') {
    const prefix = segments[0] || '';
    const rest = segments.slice(3).join('/');
    const endsWithJson = configEndpoint.endsWith('.json');
    if (rest) return `/${prefix}/${country}/${language}/${rest}`;
    return endsWithJson ? `/${prefix}/${country}/${language}.json` : `/${prefix}/${country}/${language}`;
  }

  const lastSegment = segments[segments.length - 1] || '';
  return `/${country}/${language}/${lastSegment}`;
}

// 获取数据列表，根据 dataSource 区分解析方式
// graphql: data.data.xxxList.items
// 遍历 data.data 下第一个含 items 数组的 key
// eds: data.data（数组）或 data 本身
function extractDataList(data, dataSource) {
  if (!data) return [];
  if (dataSource === 'graphql' && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const keys = Object.keys(data.data);
    for (let i = 0; i < keys.length; i += 1) {
      const node = data.data[keys[i]];
      if (node && Array.isArray(node.items)) return node.items;
    }
    return [];
  }
  if (data.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
}

// 获取搜索关键词
function getSearchKeyword() {
  const urlParams = new URLSearchParams(window.location.search);
  const raw = urlParams.get('fulltext') || '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

// 按关键词过滤数据
// product 匹配标题/系列/SKU
// news/blog 匹配标题/描述/副标题
function filterItems(items, keyword, type) {
  if (!keyword) return items;
  const kw = keyword.toLowerCase();
  return items.filter((item) => {
    const fields = [];
    if (type === 'product') {
      fields.push(item.title, item.series, item.sku, item.overseasModel);
      // eslint-disable-next-line no-underscore-dangle
      const desc = item.description_description;
      if (desc && desc.html) fields.push(desc.html);
    } else {
      fields.push(item.title, item.description, item.subtitle, item.keywords);
    }
    return fields.some((f) => f && String(f).toLowerCase().includes(kw));
  });
}

// 创建产品卡片
function createProductCard(item) {
  const card = document.createElement('a');
  card.className = 'product-card';
  card.href = item.productDetailPageLink || '#';
  if (card.href.startsWith('http')) {
    card.setAttribute('target', '_blank');
    card.setAttribute('rel', 'noopener noreferrer');
  }

  const imgWrap = document.createElement('div');
  imgWrap.className = 'product-img';

  // eslint-disable-next-line no-underscore-dangle
  const imgPath = item.mediaGallery_image && item.mediaGallery_image._path;
  if (imgPath) {
    const picture = createOptimizedPicture(imgPath, item.title || '', false);
    imgWrap.appendChild(picture);
  }

  const info = document.createElement('div');

  if (item.series) {
    const seriesEl = document.createElement('div');
    seriesEl.className = 'title-content';
    seriesEl.textContent = item.series;
    info.appendChild(seriesEl);
  }

  if (item.title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'subtitle-content';
    titleEl.textContent = item.title;
    info.appendChild(titleEl);
  }

  card.appendChild(imgWrap);
  card.appendChild(info);
  return card;
}

// 创建文章卡片
function createArticleCard(item) {
  const card = document.createElement('a');
  card.className = 'article-card';
  card.href = item.path || '#';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'article-img';
  if (item.thumbnail) {
    const picture = createOptimizedPicture(item.thumbnail, item.title || '', false);
    imgWrap.appendChild(picture);
  }

  const info = document.createElement('div');
  info.className = 'article-info';

  if (item.subtitle) {
    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'title-content';
    subtitleEl.textContent = item.subtitle;
    info.appendChild(subtitleEl);
  }

  if (item.title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'subtitle-content';
    titleEl.textContent = item.title;
    info.appendChild(titleEl);
  }

  card.appendChild(imgWrap);
  card.appendChild(info);
  return card;
}

// 计算分页页码数组
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const maxVisible = 5;
  if (currentPage <= maxVisible - 1) {
    const pages = Array.from({ length: maxVisible }, (_, i) => i + 1);
    pages.push('ellipsis', totalPages);
    return pages;
  }
  if (currentPage >= totalPages - (maxVisible - 2)) {
    const startPage = totalPages - maxVisible + 1;
    const pages = [1, 'ellipsis'];
    for (let i = startPage; i <= totalPages; i += 1) pages.push(i);
    return pages;
  }
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

// PC 端分页
function buildPaginationControls(paginationEl, state, onPageChange, config) {
  if (!paginationEl) return;
  paginationEl.textContent = '';

  const { total, pageSize, currentPage } = state;
  if (!total || !pageSize || total <= pageSize) return;

  const totalPages = Math.ceil(total / pageSize);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'page-button page-arrow-btn is-prev';
  prevBtn.setAttribute('aria-label', config.prevbuttonarialabel || 'Previous');
  const prevIcon = document.createElement('img');
  prevIcon.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
  prevIcon.alt = '';
  prevIcon.className = 'page-arrow-icon';
  prevBtn.appendChild(prevIcon);
  if (currentPage === 1) {
    prevBtn.disabled = true;
  } else {
    prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
  }
  paginationEl.appendChild(prevBtn);

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  pageNumbers.forEach((item) => {
    if (item === 'ellipsis') {
      const dots = document.createElement('span');
      dots.className = 'pagination-ellipsis';
      for (let i = 0; i < 3; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'circle';
        dots.appendChild(dot);
      }
      paginationEl.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-button';
      btn.textContent = String(item);
      if (item === currentPage) {
        btn.classList.add('is-active');
      } else {
        btn.addEventListener('click', () => onPageChange(item));
      }
      paginationEl.appendChild(btn);
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'page-button page-arrow-btn is-next';
  nextBtn.setAttribute('aria-label', config.nextbuttonarialabel || 'Next');
  const nextIcon = document.createElement('img');
  nextIcon.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
  nextIcon.alt = '';
  nextIcon.className = 'page-arrow-icon';
  nextBtn.appendChild(nextIcon);
  if (currentPage === totalPages) {
    nextBtn.disabled = true;
  } else {
    nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
  }
  paginationEl.appendChild(nextBtn);
}

// 移动端 Load More
function buildMobilePaginationControls(mobileEl, state, onLoadMore, config) {
  if (!mobileEl) return;
  mobileEl.textContent = '';

  const { total, pageSize, currentPage } = state;
  if (!total || !pageSize || currentPage * pageSize >= total) return;

  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.type = 'button';
  loadMoreBtn.classList.add('page-button');
  loadMoreBtn.textContent = config.loadmorelabel || 'Load More';
  loadMoreBtn.addEventListener('click', onLoadMore);
  mobileEl.appendChild(loadMoreBtn);
}

// block 级配置 key，即使第二列是链接也只当 config 不入 items
// 这是key-value 造成的问题
const BLOCK_CONFIG_KEYS = new Set([
  'emptyresultheading', 'noresultsubtitle', 'noresultcontent',
  'popularsearchheading', 'popularsearchtags', 'popularsearchlink',
  'prevbuttonarialabel', 'nextbuttonarialabel', 'loadmorelabel',
]);

// 提取 key-value
function parseConfig(block) {
  const config = {};
  const items = [];
  const RICHTEXT_KEYS = new Set(['noresultcontent']);
  const TAG_KEYS = new Set(['popularsearchtags']);

  const rows = [...block.children];
  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const key = (cols[0].textContent || '').trim().toLowerCase();

    if (TAG_KEYS.has(key)) {
      const links = cols[1].querySelectorAll('a');
      config[key] = links.length > 0
        ? [...links].map((l) => l.textContent.trim())
        : (cols[1].textContent || '').trim().split(',').map((t) => t.trim()).filter(Boolean);
      return;
    }

    if (RICHTEXT_KEYS.has(key)) {
      config[key] = cols[1].innerHTML || '';
      return;
    }

    if (BLOCK_CONFIG_KEYS.has(key)) {
      const link = cols[1].querySelector('a');
      config[key] = link ? (link.getAttribute('href') || link.textContent || '').trim() : (cols[1].textContent || '').trim();
      return;
    }

    const link = cols[1].querySelector('a');
    if (link) {
      items.push({
        title: (cols[0].textContent || '').trim(),
        endpoint: link.getAttribute('href') || '',
        type: cols[2] ? (cols[2].textContent || '').trim().toLowerCase() : 'product',
        dataSource: cols[3] ? (cols[3].textContent || '').trim().toLowerCase() : 'eds',
        pageSize: cols[4] ? parseInt((cols[4].textContent || '').trim(), 10) || DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE,
        sourceRow: row,
      });
    } else {
      const value = (cols[1].textContent || '').trim();
      config[key] = value;
    }
  });

  return { config, items };
}

// 单个 tab 的无结果提示
function renderNoResult(keyword, tabTitle, config) {
  const wrap = document.createElement('div');
  wrap.className = 'no-result-grid';

  const titleEl = document.createElement('div');
  titleEl.className = 'no-result-title';
  const prefix = config.emptyresultheading || 'No results for';
  titleEl.innerHTML = `${prefix} <span>${keyword || ''}</span> ${tabTitle || ''}`;
  wrap.appendChild(titleEl);

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'no-result-subtitle';
  subtitleEl.textContent = config.noresultsubtitle || 'Try a new search or the below suggestions.';
  wrap.appendChild(subtitleEl);

  return wrap;
}

// 全局无结果页面
function renderGlobalNoResult(keyword, config, tagData) {
  const wrap = document.createElement('div');
  wrap.className = 'no-result-grid';

  const titleEl = document.createElement('div');
  titleEl.className = 'no-result-title';
  const prefix = config.emptyresultheading || 'No results for';
  titleEl.innerHTML = `${prefix} <span>${keyword || ''}</span>`;
  wrap.appendChild(titleEl);

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'no-result-subtitle';
  subtitleEl.textContent = config.noresultsubtitle || 'Try a new search or the below suggestions.';
  wrap.appendChild(subtitleEl);

  if (config.noresultcontent) {
    const contentEl = document.createElement('div');
    contentEl.className = 'no-result-content';
    contentEl.innerHTML = config.noresultcontent;
    wrap.appendChild(contentEl);
  }

  const tags = config.popularsearchtags;
  if (tags && tags.length > 0) {
    const popularWrap = document.createElement('div');
    popularWrap.className = 'popular-search';

    const popularTitle = document.createElement('div');
    popularTitle.className = 'popular-search-title';
    popularTitle.textContent = config.popularsearchheading || 'Popular Search';
    popularWrap.appendChild(popularTitle);

    const tagList = document.createElement('div');
    tagList.className = 'popular-search-tags';
    const searchLink = config.popularsearchlink || window.location.pathname;
    const linkTarget = config.popularsearchlinktarget || '_self';

    tags.forEach((tagPath) => {
      const tagTitle = getTagTitle(tagPath, tagData);

      const tagEl = document.createElement('a');
      tagEl.className = 'popular-search-tag';
      const separator = searchLink.includes('?') ? '&' : '?';
      tagEl.href = `${searchLink}${separator}fulltext=${encodeURIComponent(tagTitle)}`;
      tagEl.target = linkTarget;
      tagEl.textContent = tagTitle;
      tagList.appendChild(tagEl);
    });

    popularWrap.appendChild(tagList);
    wrap.appendChild(popularWrap);
  }

  return wrap;
}

export default async function decorate(block) {
  const { config, items } = parseConfig(block);
  const keyword = getSearchKeyword();

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'search-result-wrapper';

  const tabNav = document.createElement('div');
  tabNav.className = 'tab-nav';
  wrapper.appendChild(tabNav);

  const contentArea = document.createElement('div');
  contentArea.className = 'search-content-area';
  wrapper.appendChild(contentArea);

  block.appendChild(wrapper);

  if (!items.length) {
    block.classList.add('loaded');
    return;
  }

  const tabDataMap = [];
  const hasPopularTags = config.popularsearchtags && config.popularsearchtags.length > 0;

  const fetchPromises = items.map(async (item) => {
    const { type, dataSource } = item;
    const localizedEndpoint = getLocalizedEndpoint(item.endpoint, dataSource || 'eds');
    const itemPageSize = item.pageSize || DEFAULT_PAGE_SIZE;
    try {
      const url = getEndpointUrl(localizedEndpoint, dataSource || 'eds');
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const rawData = await resp.json();

      const allItems = extractDataList(rawData, dataSource || 'eds');
      const filteredItems = filterItems(allItems, keyword, type);

      return {
        title: item.title,
        endpoint: item.endpoint,
        sourceRow: item.sourceRow,
        type,
        allItems,
        filteredItems,
        state: { pageSize: itemPageSize, currentPage: 1, total: filteredItems.length },
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`search-result-module: failed to fetch ${item.endpoint}`, err);
      return {
        title: item.title,
        endpoint: item.endpoint,
        sourceRow: item.sourceRow,
        type,
        allItems: [],
        filteredItems: [],
        state: { pageSize: itemPageSize, currentPage: 1, total: 0 },
      };
    }
  });

  const tagDataPromise = hasPopularTags ? fetchTagData() : Promise.resolve(null);
  const [results, tagData] = await Promise.all([
    Promise.all(fetchPromises),
    tagDataPromise,
  ]);
  results.forEach((r) => tabDataMap.push(r));

  const allEmpty = tabDataMap.every((t) => t.filteredItems.length === 0);

  if (allEmpty && keyword) {
    tabNav.style.display = 'none';
    contentArea.appendChild(renderGlobalNoResult(keyword, config, tagData));
    block.classList.add('loaded');
    return;
  }

  let activeTabIndex = tabDataMap.findIndex((t) => t.filteredItems.length > 0);
  if (activeTabIndex < 0) activeTabIndex = 0;

  tabDataMap.forEach((tabData, index) => {
    const tabItem = document.createElement('div');
    tabItem.className = 'tab-item';
    if (tabData.filteredItems.length === 0) tabItem.classList.add('empty');
    if (index === activeTabIndex) tabItem.classList.add('select');

    if (tabData.sourceRow) {
      moveInstrumentation(tabData.sourceRow, tabItem);
    }

    const titleText = document.createTextNode(`${tabData.title} `);
    tabItem.appendChild(titleText);

    const countSpan = document.createElement('span');
    countSpan.textContent = `(${tabData.filteredItems.length})`;
    tabItem.appendChild(countSpan);

    tabItem.dataset.tabIndex = String(index);
    tabNav.appendChild(tabItem);
  });

  tabDataMap.forEach((tabData, index) => {
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    tabContent.dataset.tabIndex = String(index);
    if (index === activeTabIndex) tabContent.classList.add('active');

    const resultsNum = document.createElement('div');
    resultsNum.className = 'results-num';
    const numSpan = document.createElement('span');
    numSpan.textContent = String(tabData.filteredItems.length);
    resultsNum.appendChild(numSpan);
    resultsNum.appendChild(document.createTextNode(' Results'));
    tabContent.appendChild(resultsNum);

    if (tabData.filteredItems.length === 0 && keyword) {
      tabContent.appendChild(renderNoResult(keyword, tabData.title, config));
    } else if (tabData.type === 'product') {
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      tabContent.appendChild(grid);
    } else {
      const grid = document.createElement('div');
      grid.className = 'article-grid';
      tabContent.appendChild(grid);
    }

    const paginationEl = document.createElement('div');
    paginationEl.className = 'search-pagination';
    tabContent.appendChild(paginationEl);

    const mobilePaginationEl = document.createElement('div');
    mobilePaginationEl.className = 'search-pagination-mobile';
    tabContent.appendChild(mobilePaginationEl);

    contentArea.appendChild(tabContent);
  });

  // 处理 tab 的卡片列表和分页
  function renderTabContent(tabIndex) {
    const tabData = tabDataMap[tabIndex];
    const tabContent = contentArea.querySelector(`.tab-content[data-tab-index="${tabIndex}"]`);
    if (!tabContent || !tabData) return;

    const { filteredItems, type, state } = tabData;
    const { currentPage, pageSize } = state;
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = filteredItems.slice(startIdx, startIdx + pageSize);

    if (type === 'product') {
      const grid = tabContent.querySelector('.product-grid');
      if (grid) {
        grid.textContent = '';
        pageItems.forEach((item) => {
          grid.appendChild(createProductCard(item));
        });
      }
    } else {
      const grid = tabContent.querySelector('.article-grid');
      if (grid) {
        grid.textContent = '';
        pageItems.forEach((item) => {
          grid.appendChild(createArticleCard(item));
        });
      }
    }

    const paginationEl = tabContent.querySelector('.search-pagination');
    const mobilePaginationEl = tabContent.querySelector('.search-pagination-mobile');

    const onPageChange = (newPage) => {
      tabData.state.currentPage = newPage;
      renderTabContent(tabIndex);
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const onLoadMore = () => {
      const grid = tabContent.querySelector('.product-grid') || tabContent.querySelector('.article-grid');
      if (!grid) return;

      const nextPage = tabData.state.currentPage + 1;
      const moreStart = tabData.state.currentPage * pageSize;
      const moreItems = filteredItems.slice(moreStart, moreStart + pageSize);

      moreItems.forEach((item) => {
        if (type === 'product') {
          grid.appendChild(createProductCard(item));
        } else {
          grid.appendChild(createArticleCard(item));
        }
      });

      tabData.state.currentPage = nextPage;
      buildPaginationControls(paginationEl, tabData.state, onPageChange, config);
      buildMobilePaginationControls(mobilePaginationEl, tabData.state, onLoadMore, config);
    };

    buildPaginationControls(paginationEl, tabData.state, onPageChange, config);
    buildMobilePaginationControls(mobilePaginationEl, tabData.state, onLoadMore, config);
  }

  tabDataMap.forEach((_, index) => {
    renderTabContent(index);
  });

  const tabItems = tabNav.querySelectorAll('.tab-item');
  tabItems.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabItems.forEach((t) => t.classList.remove('select'));
      tab.classList.add('select');

      const idx = parseInt(tab.dataset.tabIndex, 10);
      contentArea.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));
      const target = contentArea.querySelector(`.tab-content[data-tab-index="${idx}"]`);
      if (target) target.classList.add('active');
    });
  });

  block.classList.add('loaded');
}
