import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { isMobileWindow } from '../../scripts/device.js';

const DEFAULT_PAGE_SIZE = 12;
const CONFIG_KEYS = new Set([
  'pagesize',
  'pageSize',
  'emptyresultheading',
  'emptyResultHeading',
  'noresultsubtitle',
  'noResultSubtitle',
  'prevbuttonarialabel',
  'prevButtonAriaLabel',
  'nextbuttonarialabel',
  'nextButtonAriaLabel',
  'loadmorelabel',
  'loadMoreLabel',
  'productcardlink',
  'productCardLink',
]);

function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

const getPropertyByKey = (item, propKey) => {
  if (!item || !propKey) return undefined;
  if (Object.prototype.hasOwnProperty.call(item, propKey)) return item[propKey];
  const parts = propKey.includes('.') ? propKey.split('.') : propKey.split('_');
  return parts.reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), item);
};

const normalizeValueForSort = (value, sortProperty) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? String(value).toLowerCase() : parsed;
  }
  if (typeof value === 'string' && sortProperty.toLowerCase().includes('size')) {
    const m = value.match(/(\d+(\.\d+)?)/);
    if (m) return parseFloat(m[1]);
  }
  return String(value).toLowerCase();
};

// author 产品接口走 /bin/hisense/productList.json?path=路径，FAQ 走 GraphQL
function getEndpointUrl(endpointPath, type) {
  let path = endpointPath;
  const hostname = window.location.hostname || '';
  const isAuthorEnv = hostname.includes('author-');

  if (isAuthorEnv && path && path.endsWith('.json')) {
    if (type === 'product') {
      let pathWithoutJson = path.replace(/\.json$/, '');
      pathWithoutJson = pathWithoutJson.replace(/^\/product\/?/, '/') || '/';
      const productListPath = `/bin/hisense/productList.json?path=${encodeURIComponent(pathWithoutJson)}`;
      path = window.GRAPHQL_BASE_URL ? `${window.GRAPHQL_BASE_URL}${productListPath}` : productListPath;
    } else {
      const pathWithoutJson = path.replace(/\.json$/, '');
      const graphqlPath = `/graphql/execute.json/global/GetFaqByPath;path=/content/dam/hisense/content-fragments${pathWithoutJson}`;
      path = window.GRAPHQL_BASE_URL ? `${window.GRAPHQL_BASE_URL}${graphqlPath}` : graphqlPath;
    }
  } else {
    const baseUrl = window.GRAPHQL_BASE_URL || '';
    path = baseUrl ? `${baseUrl}${path}` : path;
  }

  const fiveMinutesMs = 5 * 60 * 1000;
  const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
  const sep = path.indexOf('?') >= 0 ? '&' : '?';
  return `${path}${sep}_t=${cacheBuster}`;
}

// 多国家多语言国际化接口url
function getLocalizedEndpoint(configEndpoint) {
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
  const isAemEnv = hostname.includes('author') || hostname.includes('publish');

  if (isAemEnv) return configEndpoint;

  const { pathname } = window.location;
  const segments = pathname.split('/').filter(Boolean);

  const country = segments[0] || 'us';
  const language = country.toLowerCase() === 'us' ? 'en' : (segments[1] || 'en');

  const endpointSegments = configEndpoint.split('/').filter(Boolean);
  const prefix = endpointSegments[0] || 'product';
  const rest = endpointSegments.slice(3).join('/');
  const endsWithJson = configEndpoint.endsWith('.json');

  if (rest) return `/${prefix}/${country}/${language}/${rest}`;
  return endsWithJson ? `/${prefix}/${country}/${language}.json` : `/${prefix}/${country}/${language}`;
}

// 根据 endpoint 路径获取数据类型
function detectEndpointType(endpoint) {
  if (endpoint.includes('/product/')) return 'product';
  if (endpoint.includes('/faq/')) return 'faq';
  return 'unknown';
}

// 产品列表
function extractProductList(data) {
  if (!data) return [];
  if (data.data && data.data.productModelList && Array.isArray(data.data.productModelList.items)) {
    return data.data.productModelList.items;
  }
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
}

// FAQ 列表
function extractFaqList(data) {
  if (!data) return [];
  if (data.data && data.data.faqList && Array.isArray(data.data.faqList.items)) {
    return data.data.faqList.items;
  }
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
}

// 根据响应结果判断数据是 product 还是 faq
function detectDataType(data) {
  if (data.data && data.data.productModelList) return 'product';
  if (data.data && data.data.faqList) return 'faq';
  return 'unknown';
}

// 从 URL 参数 ?fulltext= 获取搜索关键词
function getSearchKeyword() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('fulltext') || '';
}

// 过滤产品（匹配 title/series/sku/overseasModel/description）
function filterProducts(items, keyword) {
  if (!keyword) return items;
  const kw = keyword.toLowerCase();
  return items.filter((item) => {
    const fields = [
      item.title,
      item.series,
      item.sku,
      item.overseasModel,
    ];
    const desc = item.description_description;
    if (desc && desc.html) fields.push(desc.html);
    return fields.some((f) => f && String(f).toLowerCase().includes(kw));
  });
}

// 过滤 FAQ（匹配 question/productCategory/answer）
function filterFaqs(items, keyword) {
  if (!keyword) return items;
  const kw = keyword.toLowerCase();
  return items.filter((item) => {
    const fields = [
      item.question,
      item.productCategory,
    ];
    if (item.answer && item.answer.html) fields.push(item.answer.html);
    return fields.some((f) => f && String(f).toLowerCase().includes(kw));
  });
}

const SORT_TEXT_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function getProductSortDateValue(item) {
  const time = Date.parse(item.productLaunchDate);
  return Number.isNaN(time) ? 0 : time;
}

function getProductSortTextValue(item) {
  return item.title || item.series || item.sku || item.overseasModel || '';
}

// 一级按日期倒序；日期相同则按标题 Z-A / 9-0 倒序
function sortProducts(items) {
  return [...items].sort((a, b) => {
    const dateDiff = getProductSortDateValue(b) - getProductSortDateValue(a);
    if (dateDiff !== 0) return dateDiff;

    const textDiff = SORT_TEXT_COLLATOR.compare(
      getProductSortTextValue(b),
      getProductSortTextValue(a),
    );
    return textDiff;
  });
}

function buildConfiguredProductCardLink(configuredLink, sku, category) {
  if (!configuredLink) return '';

  try {
    const url = new URL(configuredLink, window.location.origin);
    if (sku) {
      url.searchParams.set('sku', sku);
    }
    if (category) {
      url.searchParams.set('category', category);
    }
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return url.toString();
  } catch (e) {
    const params = new URLSearchParams();
    if (sku) {
      params.set('sku', sku);
    }
    if (category) {
      params.set('category', category);
    }
    const query = params.toString();
    if (!query) return configuredLink;
    const separator = configuredLink.includes('?') ? '&' : '?';
    return `${configuredLink}${separator}${query}`;
  }
}

function getProductCardHref(item, config) {
  const configuredLink = config.productcardlink || config.productCardLink;
  if (configuredLink) {
    return buildConfiguredProductCardLink(configuredLink, item?.sku, item?.category);
  }
  return item.productDetailPageLink || '#';
}

// 创建单个产品卡片
function createProductCard(item, config = {}) {
  const card = document.createElement('a');
  card.className = 'product-card';
  card.href = getProductCardHref(item, config);
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

// 创建 FAQ 卡片
function createFaqCard(faqItem, index) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const country = segments[segments[0] === 'content' ? 2 : 0] || '';
  const card = document.createElement('div');
  card.className = index === 0 ? 'faq-card' : 'faq-card hide';

  const title = document.createElement('div');
  title.className = 'faq-title';

  const titleContent = document.createElement('div');

  if (faqItem.productCategory) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'title-content';
    categoryDiv.textContent = faqItem.productCategory;
    titleContent.appendChild(categoryDiv);
  }

  if (faqItem.question) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'subtitle-content';
    questionDiv.textContent = faqItem.question;
    titleContent.appendChild(questionDiv);
  }

  const iconWrapper = document.createElement('div');
  const icon = document.createElement('img');
  icon.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
  icon.alt = '';
  icon.className = 'chevron';
  iconWrapper.appendChild(icon);

  title.appendChild(titleContent);
  title.appendChild(iconWrapper);

  const content = document.createElement('div');
  content.className = 'faq-content';

  const answerSpan = document.createElement('span');
  if (faqItem.answer) {
    if (typeof faqItem.answer === 'object' && faqItem.answer.html) {
      answerSpan.innerHTML = faqItem.answer.html;
    } else if (typeof faqItem.answer === 'string') {
      answerSpan.textContent = faqItem.answer;
    }
  }
  content.appendChild(answerSpan);

  card.appendChild(title);
  card.appendChild(content);
  return card;
}

// 分页页码
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

// PC 端分页按钮
function buildPaginationControls(paginationEl, state, onPageChange, config) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const country = segments[segments[0] === 'content' ? 2 : 0] || '';
  if (!paginationEl) return;
  paginationEl.textContent = '';

  const { total, pageSize, currentPage } = state;
  if (!total || !pageSize || total <= pageSize) return;

  const totalPages = Math.ceil(total / pageSize);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'page-button';
  prevBtn.setAttribute('aria-label', config.prevbuttonarialabel || 'Previous');
  const prevIcon = document.createElement('img');
  prevIcon.src = `/content/dam/hisense/${country}/common-icons/left.svg`;
  prevIcon.alt = '';
  prevIcon.className = 'page-arrow';
  const prevDisabledIcon = document.createElement('img');
  prevDisabledIcon.src = `/content/dam/hisense/${country}/common-icons/left-disabled.svg`;
  prevDisabledIcon.className = 'page-arrow is-prev disabled';
  prevBtn.appendChild(prevIcon);
  prevBtn.appendChild(prevDisabledIcon);
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
  nextBtn.className = 'page-button is-next';
  nextBtn.setAttribute('aria-label', config.nextbuttonarialabel || 'Next');
  const nextIcon = document.createElement('img');
  nextIcon.src = `/content/dam/hisense/${country}/common-icons/right.svg`;
  nextIcon.alt = '';
  nextIcon.className = 'page-arrow';
  const nextDisabledIcon = document.createElement('img');
  nextDisabledIcon.src = `/content/dam/hisense/${country}/common-icons/right-disabled.svg`;
  nextDisabledIcon.className = 'page-arrow is-next disabled';
  nextBtn.appendChild(nextIcon);
  nextBtn.appendChild(nextDisabledIcon);
  if (currentPage === totalPages) {
    nextBtn.disabled = true;
  } else {
    nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
  }
  paginationEl.appendChild(nextBtn);
}

// 移动端 Load More 按钮
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

// 解析 block DOM：config 行为纯文本 key-value，item 行第二列含 <a> 链接
function parseConfig(block) {
  const config = {};
  const items = [];

  const rows = [...block.children];
  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const rawKey = (cols[0].textContent || '').trim();
    const normalizedKey = rawKey.toLowerCase();
    const link = cols[1].querySelector('a');
    if (link && !CONFIG_KEYS.has(normalizedKey) && !CONFIG_KEYS.has(rawKey)) {
      items.push({
        title: rawKey,
        endpoint: link.getAttribute('href') || '',
        sourceRow: row,
      });
    } else {
      const key = normalizedKey;
      const value = link ? (link.getAttribute('href') || '').trim() : (cols[1].textContent || '').trim();
      config[key] = value;
    }
  });

  return { config, items };
}

// FAQ 卡片展开/收起
function initFaqAccordion(container) {
  const faqTitles = container.querySelectorAll('.faq-card .faq-title');
  faqTitles.forEach((title) => {
    if (title.dataset.bound) return;
    title.dataset.bound = 'true';
    title.addEventListener('click', (e) => {
      e.stopPropagation();
      const faqCard = title.closest('.faq-card');
      if (faqCard) faqCard.classList.toggle('hide');
    });
  });
}

// 无结果提示
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

export default async function decorate(block) {
  const resource = block.dataset.aueResource;
  if (resource && block.parentNode) {
    [...block.parentNode.querySelectorAll('.support-search-result-module.block')]
      .filter((el) => el !== block && el.dataset.aueResource === resource)
      .forEach((el) => el.remove());
  }

  if (block.classList.contains('loaded')) {
    const oldWrapper = block.querySelector('.search-result-wrapper');
    if (oldWrapper) oldWrapper.remove();
    block.classList.remove('loaded');
  }

  const { config, items } = parseConfig(block);

  const pageSize = parseInt(config.pagesize || config.pageSize || DEFAULT_PAGE_SIZE, 10);
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

  const fetchPromises = items.map(async (item) => {
    const localizedEndpoint = getLocalizedEndpoint(item.endpoint);
    const endpointType = detectEndpointType(localizedEndpoint);
    try {
      const url = getEndpointUrl(localizedEndpoint, endpointType);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const rawData = await resp.json();
      const dataType = detectDataType(rawData);

      let allItems = [];
      let filteredItems = [];
      let resolvedType = dataType !== 'unknown' ? dataType : endpointType;

      if (resolvedType === 'product') {
        allItems = extractProductList(rawData);
        filteredItems = sortProducts(filterProducts(allItems, keyword));
      } else if (resolvedType === 'faq') {
        allItems = extractFaqList(rawData);
        filteredItems = filterFaqs(allItems, keyword);
      } else {
        allItems = extractProductList(rawData);
        if (allItems.length === 0) allItems = extractFaqList(rawData);
        filteredItems = allItems;
        resolvedType = 'product';
      }

      return {
        title: item.title,
        endpoint: item.endpoint,
        sourceRow: item.sourceRow,
        type: resolvedType,
        allItems,
        filteredItems,
        state: { pageSize, currentPage: 1, total: filteredItems.length },
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`support-search-result-module: failed to fetch ${item.endpoint}`, err);
      return {
        title: item.title,
        endpoint: item.endpoint,
        sourceRow: item.sourceRow,
        type: 'unknown',
        allItems: [],
        filteredItems: [],
        state: { pageSize, currentPage: 1, total: 0 },
      };
    }
  });

  const results = await Promise.all(fetchPromises);
  results.forEach((r) => tabDataMap.push(r));

  const allEmpty = tabDataMap.every((t) => t.filteredItems.length === 0);

  if (allEmpty && keyword) {
    tabNav.style.display = 'none';
    contentArea.appendChild(renderNoResult(keyword, '', config));
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

    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    const sortBox = document.createElement('div');
    sortBox.className = 'support-sort-box';
    if (block.parentNode.parentNode && tabData.type === 'product') {
      sortBox.append(block.parentNode.parentNode.querySelector('.plp-filters-bar').cloneNode(true));

      const sort = sortBox.querySelector('.plp-sort');
      sort.addEventListener('click', (e) => {
        sortBox.classList.toggle('show');
        // 为排序移动端添加样式
        // if (isMobileWindow()) {
        //   e.preventDefault();
        // } else {
        //   sortBox.classList.toggle('show');
        // }
      });
      const sortOptions = sortBox.querySelector('.plp-sort-options');
      sortOptions.querySelectorAll('.plp-sort-option').forEach((option) => {
        option.addEventListener('click', () => {
          if (option.classList.contains('selected')) {
            sortBox.classList.remove('show');
            return;
          }

          sortOptions.querySelectorAll('.plp-sort-option').forEach((opt) => {
            opt.classList.remove('selected');
          });
          option.classList.add('selected');

          const prefix = 'Sort:';
          const splitText = option.textContent.split(':')[0].trim();
          const sortSpan = sortBox.querySelector('.plp-sort span');
          sortSpan.textContent = `${prefix} ${splitText}`;
          sortBox.classList.remove('show');
          try {
            const sortKey = (option.dataset && Object.prototype.hasOwnProperty.call(option.dataset, 'value'))
              ? option.dataset.value
              : (option.getAttribute && option.getAttribute('data-value'));
            const sortArray = (arr, sortProperty, ascending = false) => [...arr].sort((a, b) => {
              const valA = normalizeValueForSort(a[sortProperty], sortProperty);
              const valB = normalizeValueForSort(b[sortProperty], sortProperty);
              if (valA === null && valB === null) return 0;
              if (valA === null) return 1;
              if (valB === null) return -1;
              if (typeof valA === 'number' && typeof valB === 'number') {
                return ascending ? valA - valB : valB - valA;
              }

              return ascending
                ? valA.localeCompare(valB, 'en', { sensitivity: 'base', caseFirst: 'upper' })
                : valB.localeCompare(valA, 'en', { sensitivity: 'base', caseFirst: 'upper' });
            });
            const arr = sortArray(tabData.filteredItems, sortKey);
            tabData.filteredItems = JSON.parse(JSON.stringify(arr));
            // eslint-disable-next-line no-use-before-define
            renderTabContent(index);
          } catch (e) { /* empty */ }
        });
      });

      // 点击关闭下拉
      document.addEventListener('click', (e) => {
        if (!sortBox.contains(e.target)) {
          sortBox.classList.remove('show');
        }
      });
    }

    const resultsNum = document.createElement('div');
    resultsNum.className = 'results-num';
    const numSpan = document.createElement('span');
    numSpan.textContent = String(tabData.filteredItems.length);
    resultsNum.appendChild(numSpan);
    resultsNum.appendChild(document.createTextNode(' Results'));
    filterGroup.append(resultsNum, sortBox);
    tabContent.appendChild(filterGroup);

    if (tabData.filteredItems.length === 0 && keyword) {
      tabContent.appendChild(renderNoResult(keyword, tabData.title, config));
    } else if (tabData.type === 'product') {
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      tabContent.appendChild(grid);
    } else if (tabData.type === 'faq') {
      const grid = document.createElement('div');
      grid.className = 'faq-grid';
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

  function renderTabContent(tabIndex) {
    const tabData = tabDataMap[tabIndex];
    const tabContent = contentArea.querySelector(`.tab-content[data-tab-index="${tabIndex}"]`);
    if (!tabContent || !tabData) return;

    const { filteredItems, type, state } = tabData;
    const { currentPage } = state;
    const startIdx = (currentPage - 1) * pageSize;
    const pageItems = filteredItems.slice(startIdx, startIdx + pageSize);

    if (type === 'product') {
      const grid = tabContent.querySelector('.product-grid');
      if (grid) {
        grid.textContent = '';
        pageItems.forEach((item) => {
          grid.appendChild(createProductCard(item, config));
        });
      }
    } else if (type === 'faq') {
      const grid = tabContent.querySelector('.faq-grid');
      if (grid) {
        grid.textContent = '';
        pageItems.forEach((item, idx) => {
          grid.appendChild(createFaqCard(item, idx));
        });
        initFaqAccordion(tabContent);
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
      const grid = tabContent.querySelector('.product-grid') || tabContent.querySelector('.faq-grid');
      if (!grid) return;

      const nextPage = tabData.state.currentPage + 1;
      const moreStart = tabData.state.currentPage * pageSize;
      const moreItems = filteredItems.slice(moreStart, moreStart + pageSize);

      moreItems.forEach((item, idx) => {
        if (type === 'product') {
          grid.appendChild(createProductCard(item, config));
        } else if (type === 'faq') {
          grid.appendChild(createFaqCard(item, moreStart + idx));
          initFaqAccordion(tabContent);
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
