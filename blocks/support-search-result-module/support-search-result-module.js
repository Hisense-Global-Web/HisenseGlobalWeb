import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_PAGE_SIZE = 12;

function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

// 接口urlauthor 环境自动转为 GraphQL
function getEndpointUrl(endpointPath, type) {
  let path = endpointPath;
  const hostname = window.location.hostname || '';
  const isAuthorEnv = hostname.includes('author-');

  if (isAuthorEnv && path && path.endsWith('.json')) {
    const pathWithoutJson = path.replace(/\.json$/, '');
    const graphqlName = type === 'product' ? 'GetProductByPath' : 'GetFaqByPath';
    const graphqlPath = `/graphql/execute.json/global/${graphqlName};path=/content/dam/hisense/content-fragments${pathWithoutJson}`;
    path = window.GRAPHQL_BASE_URL ? `${window.GRAPHQL_BASE_URL}${graphqlPath}` : graphqlPath;
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
  const lastSegment = endpointSegments[endpointSegments.length - 1] || 'televisions.json';

  return `/${prefix}/${country}/${language}/${lastSegment}`;
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

// 创建单个产品卡片
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
  prevBtn.className = 'page-button page-arrow-btn is-prev';
  prevBtn.setAttribute('aria-label', config.prevbuttonarialabel || 'Previous');
  const prevIcon = document.createElement('img');
  prevIcon.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
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
  nextIcon.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
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

    const link = cols[1].querySelector('a');
    if (link) {
      items.push({
        title: (cols[0].textContent || '').trim(),
        endpoint: link.getAttribute('href') || '',
        sourceRow: row,
      });
    } else {
      const key = (cols[0].textContent || '').trim().toLowerCase();
      const value = (cols[1].textContent || '').trim();
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
        filteredItems = filterProducts(allItems, keyword);
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
          grid.appendChild(createProductCard(item));
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
          grid.appendChild(createProductCard(item));
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
