import { readBlockConfig } from '../../scripts/aem.js';
import { getLocaleFromPath } from '../../scripts/locale-utils.js';

const DEFAULT_FAQ_ENDPOINT = '/faq/us/en/television.json';
const DEFAULT_TAGS_ENDPOINT = '/content/cq:tags/hisense/faq.-1.json';
const DEFAULT_PAGE_SIZE = 10;

// 简单哈希函数，用于缓存破坏
function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

// 获取带缓存的URL，author环境使用GraphQL
function getEndpointUrl(endpointPath) {
  const path = endpointPath || DEFAULT_FAQ_ENDPOINT;
  const hostname = window.location.hostname || '';
  const isAuthorEnv = hostname.includes('author-');

  let url;
  if (isAuthorEnv && !path.includes('/content/cq:tags')) {
    let pathWithoutJson = path.replace(/\.json$/, '');
    pathWithoutJson = pathWithoutJson.replace(/^\/product\/?/, '/') || '/';
    const graphqlPath = `/graphql/execute.json/global/GetFaqByPath;path=/content/dam/hisense/content-fragments${pathWithoutJson}`;
    url = window.GRAPHQL_BASE_URL ? `${window.GRAPHQL_BASE_URL}${graphqlPath}` : graphqlPath;
  } else {
    const baseUrl = window.GRAPHQL_BASE_URL || '';
    url = baseUrl ? `${baseUrl}${path}` : path;
  }

  const fiveMinutesMs = 5 * 60 * 1000;
  const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
  const sep = url.indexOf('?') >= 0 ? '&' : '?';

  return `${url}${sep}_t=${cacheBuster}`;
}

// 根据当前URL语言获取本地化接口Url
function getLocalizedEndpoint(configEndpoint) {
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
  const isAemEnv = hostname.includes('author') || hostname.includes('publish');

  if (isAemEnv) {
    return configEndpoint;
  }

  const { country, language } = getLocaleFromPath();

  const endpointSegments = configEndpoint.split('/').filter(Boolean);
  const prefix = endpointSegments[0] || 'faq';

  if (endpointSegments.length >= 4) {
    return `/${prefix}/${country}/${language}/${endpointSegments.slice(3).join('/')}`;
  }

  if (endpointSegments.length === 3) {
    const thirdSegment = endpointSegments[2];
    const localeFile = thirdSegment.replace(/\.json$/i, '');

    if (/^[a-z]{2}(?:-[a-z]{2})?$/i.test(localeFile) && thirdSegment.endsWith('.json')) {
      return `/${prefix}/${country}/${language}.json`;
    }

    return `/${prefix}/${country}/${language}/${thirdSegment}`;
  }

  if (endpointSegments.length === 2) {
    return `/${prefix}/${country}/${language}/${endpointSegments[1]}`;
  }

  return `/${prefix}/${country}/${language}`;
}

// 从两种格式中提取FAQ列表（为了兼容EDS JSON 格式）
function extractFaqList(data) {
  if (!data) return [];

  if (data.data && data.data.faqList && Array.isArray(data.data.faqList.items)) {
    return data.data.faqList.items;
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }

  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

// 获取FAQ标签数据
async function fetchFaqTags() {
  try {
    const url = getEndpointUrl(DEFAULT_TAGS_ENDPOINT);
    const resp = await fetch(url);
    const data = await resp.json();

    const tags = {};
    Object.keys(data).forEach((key) => {
      if (!key.startsWith('jcr:') && typeof data[key] === 'object' && data[key] !== null) {
        tags[key] = data[key]['jcr:title'] || key;
      }
    });

    return tags;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('faq-module: failed to fetch FAQ tags', err);
    return {};
  }
}

// 渲染FAQ标签页
function renderFaqTabs(faqData, tags, allTabLabel, showTabCount) {
  const tabsEl = document.createElement('div');
  tabsEl.className = 'faq-summary-tabs';

  const tagCounts = {};
  const allTags = new Set();

  faqData.forEach((faq) => {
    if (Array.isArray(faq.tags)) {
      faq.tags.forEach((tag) => {
        const tagKey = tag.split('/').pop();
        allTags.add(tagKey);
        tagCounts[tagKey] = (tagCounts[tagKey] || 0) + 1;
      });
    }
  });

  const allTab = document.createElement('div');
  allTab.className = 'faq-summary-tab selected';
  allTab.textContent = showTabCount
    ? `${allTabLabel} (${faqData.length})`
    : allTabLabel;
  allTab.dataset.tag = 'all';
  tabsEl.appendChild(allTab);

  Object.keys(tags).forEach((tagKey) => {
    if (allTags.has(tagKey)) {
      const tab = document.createElement('div');
      tab.className = 'faq-summary-tab';
      tab.textContent = showTabCount
        ? `${tags[tagKey]} (${tagCounts[tagKey] || 0})`
        : tags[tagKey];
      tab.dataset.tag = tagKey;
      tabsEl.appendChild(tab);
    }
  });

  return tabsEl;
}

// 渲染FAQ文本区域（标题、副标题、标签页）
function renderFaqSummary(container, config, faqData, tags) {
  const summaryEl = document.createElement('div');
  summaryEl.className = 'faq-summary';

  if (config.title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'faq-summary-title';
    titleEl.textContent = config.title;
    summaryEl.appendChild(titleEl);
  }

  if (config.subtitle && config.showSubtitle) {
    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'faq-summary-subtitle';
    subtitleEl.textContent = config.subtitle;
    summaryEl.appendChild(subtitleEl);
  }

  if (config.showTabs && Object.keys(tags).length > 0) {
    const tabsEl = renderFaqTabs(faqData, tags, config.allTabLabel || 'All', config.showTabCount);
    summaryEl.appendChild(tabsEl);
  }

  const faqGrid = container.querySelector('.faq-grid');
  if (faqGrid) {
    container.insertBefore(summaryEl, faqGrid);
  } else {
    container.appendChild(summaryEl);
  }
}

// 创建单个FAQ卡片
function createFaqCard(faqItem, index) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const country = segments[segments[0] === 'content' ? 2 : 0] || '';
  const card = document.createElement('div');
  card.className = index === 0 ? 'faq-card' : 'faq-card hide';
  card.dataset.tags = Array.isArray(faqItem.tags) ? faqItem.tags.join(',') : '';

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

// 计算分页页码
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

  return [
    1,
    'ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis',
    totalPages,
  ];
}

// 创建PC端分页按钮
function buildPaginationControls(container, state, onPageChange, config) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const country = segments[segments[0] === 'content' ? 2 : 0] || '';
  const { total, pageSize, currentPage } = state;

  const paginationEl = container.querySelector('.faq-pagination');
  if (!paginationEl) return;

  paginationEl.textContent = '';

  if (!total || !pageSize || total <= pageSize) {
    return;
  }

  const totalPages = Math.ceil(total / pageSize);
  const prevAriaLabel = config['prev-button-aria-label'] || config.prevButtonAriaLabel || 'Previous';
  const nextAriaLabel = config['next-button-aria-label'] || config.nextButtonAriaLabel || 'Next';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'page-button page-arrow-btn is-prev';
  prevBtn.setAttribute('aria-label', prevAriaLabel);
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
  nextBtn.setAttribute('aria-label', nextAriaLabel);
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

// 创建移动端加载load more按钮
function buildMobilePaginationControls(container, state, onLoadMore, config) {
  const { total, pageSize, currentPage } = state;
  const mobilePaginationEl = container.querySelector('.faq-pagination-mobile');
  if (!mobilePaginationEl) return;

  mobilePaginationEl.textContent = '';

  if (!total || !pageSize || currentPage * pageSize >= total) {
    return;
  }

  const loadMoreLabel = config['load-more-label'] || config.loadMoreLabel || 'Load More';

  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.type = 'button';
  loadMoreBtn.classList.add('page-button');
  loadMoreBtn.textContent = loadMoreLabel;
  loadMoreBtn.addEventListener('click', onLoadMore);
  mobilePaginationEl.appendChild(loadMoreBtn);
}

// 渲染FAQ列表
function renderFaqList(faqData, container, state, onPageChange, onLoadMore, config) {
  if (!container) return;

  const faqGrid = container.querySelector('.faq-grid');
  if (!faqGrid) return;

  faqGrid.textContent = '';

  if (!faqData || faqData.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'faq-empty';
    emptyMessage.textContent = 'No FAQ items available.';
    faqGrid.appendChild(emptyMessage);
    return;
  }

  faqData.forEach((faqItem, index) => {
    const card = createFaqCard(faqItem, index);
    faqGrid.appendChild(card);
  });

  buildPaginationControls(container, state, onPageChange, config);
  buildMobilePaginationControls(container, state, onLoadMore, config);
}

// 初始化FAQ交互
function initFaqAccordion(block) {
  const faqTitles = block.querySelectorAll('.faq-card .faq-title');

  faqTitles.forEach((title) => {
    if (title.dataset.bound) return;
    title.dataset.bound = 'true';
    title.addEventListener('click', (e) => {
      e.stopPropagation();
      const faqCard = title.closest('.faq-card');
      if (faqCard) {
        faqCard.classList.toggle('hide');
      }
    });
  });
}

// 初始化标签切换
function initTabSwitching(block, allFaqData, state, renderCallback) {
  const tabs = block.querySelectorAll('.faq-summary-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('selected'));
      tab.classList.add('selected');

      const selectedTag = tab.dataset.tag;
      let filteredData = allFaqData;

      if (selectedTag !== 'all') {
        filteredData = allFaqData.filter((faq) => {
          if (Array.isArray(faq.tags)) {
            return faq.tags.some((tag) => tag.endsWith(selectedTag));
          }
          return false;
        });
      }

      state.currentPage = 1;
      state.total = filteredData.length;

      renderCallback(filteredData);
    });
  });
}

// 获取URL参数
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function normalizeFilterValue(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesFilterValue(source, target) {
  const normalizedTarget = normalizeFilterValue(target);
  if (!normalizedTarget) return true;

  if (Array.isArray(source)) {
    return source.some((item) => normalizeFilterValue(item) === normalizedTarget);
  }

  if (typeof source === 'string') {
    return normalizeFilterValue(source) === normalizedTarget;
  }

  return false;
}

// 根据Category过滤FAQ列表
function filterFaqByCategory(faqData, category) {
  if (!category) return faqData;

  return faqData.filter((faq) => matchesFilterValue(faq.productCategory, category));
}

// 根据SKU过滤FAQ列表
function filterFaqBySku(faqData, sku) {
  if (!sku) return faqData;

  return faqData.filter((faq) => matchesFilterValue(faq.sku, sku));
}

// 获取相对路径
function getRelativePath(url) {
  if (!url) return '';
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch (e) {
    return url;
  }
}

// 初始化FAQ模块
export default async function decorate(block) {
  const resource = block.dataset.aueResource;
  if (resource && block.parentNode) {
    [...block.parentNode.querySelectorAll('.faq-module.block')]
      .filter((el) => el !== block && el.dataset.aueResource === resource)
      .forEach((el) => el.remove());
  }

  if (block.classList.contains('loaded')) {
    const oldWrapper = block.querySelector('.faq-module-wrapper');
    if (oldWrapper) oldWrapper.remove();
    block.classList.remove('loaded');
  }

  const config = readBlockConfig(block);

  const rawEndpoint = config.endpoint || DEFAULT_FAQ_ENDPOINT;
  const configuredEndpoint = getRelativePath(rawEndpoint);

  const pageSize = parseInt(config['page-size'] || config.pageSize || config.pagesize || DEFAULT_PAGE_SIZE, 10);
  const showTabs = String(config.showTabs ?? config.showtabs ?? 'true') !== 'false';
  const showTabCount = String(config.showTabCount ?? config.showtabcount ?? 'true') !== 'false';
  const showSubtitle = String(config.showSubtitle ?? config.showsubtitle ?? 'true') !== 'false';
  const allTabLabel = config['all-tab-label'] || config.allTabLabel || config.alltablabel || 'All';
  const title = config.title || '';
  const subtitle = config.subtitle || '';

  const state = {
    pageSize,
    currentPage: 1,
    total: 0,
  };

  const endpoint = getLocalizedEndpoint(configuredEndpoint);

  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement('div');
  wrapper.className = 'faq-module-wrapper';

  const faqGrid = document.createElement('div');
  faqGrid.className = 'faq-grid';
  wrapper.appendChild(faqGrid);

  const paginationEl = document.createElement('div');
  paginationEl.className = 'faq-pagination';
  wrapper.appendChild(paginationEl);

  const mobilePaginationEl = document.createElement('div');
  mobilePaginationEl.className = 'faq-pagination-mobile';
  wrapper.appendChild(mobilePaginationEl);

  fragment.appendChild(wrapper);

  block.textContent = '';
  block.appendChild(fragment);

  let allFaqData = [];
  let tags = {};

  const fullConfig = {
    title,
    subtitle,
    showSubtitle,
    showTabs,
    showTabCount,
    allTabLabel,
    pageSize,
    prevButtonAriaLabel: config['prev-button-aria-label'] || config.prevbuttonarialabel || config.prevButtonAriaLabel || 'Previous page',
    nextButtonAriaLabel: config['next-button-aria-label'] || config.nextbuttonarialabel || config.nextButtonAriaLabel || 'Next page',
    loadMoreLabel: config['load-more-label'] || config.loadmorelabel || config.loadMoreLabel || 'Load More',
  };

  try {
    const [faqResp, tagsData] = await Promise.allSettled([
      fetch(getEndpointUrl(endpoint)),
      showTabs ? fetchFaqTags() : Promise.resolve({}),
    ]);

    if (faqResp.status === 'fulfilled') {
      const faqData = await faqResp.value.json();
      allFaqData = extractFaqList(faqData);
    }

    if (showTabs && tagsData.status === 'fulfilled') {
      tags = tagsData.value;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('faq-module: failed to fetch data', err);
  }

  state.total = allFaqData.length;

  // 根据URL参数过滤FAQ，category 优先级高于 sku
  const categoryParam = getUrlParameter('category');
  const skuParam = getUrlParameter('sku');
  let filteredFaqData = allFaqData;
  if (categoryParam) {
    filteredFaqData = filterFaqByCategory(allFaqData, categoryParam);
  } else if (skuParam) {
    filteredFaqData = filterFaqBySku(allFaqData, skuParam);
  }

  const container = block.querySelector('.faq-module-wrapper');
  if (container) {
    renderFaqSummary(
      container,
      {
        title,
        subtitle,
        showSubtitle,
        showTabs,
        showTabCount,
        allTabLabel,
      },
      filteredFaqData,
      tags,
    );

    const renderPage = (data, page = 1) => {
      state.currentPage = page;
      const displayData = data.slice((page - 1) * state.pageSize, page * state.pageSize);

      renderFaqList(
        displayData,
        container,
        { ...state, total: data.length },
        (newPage) => renderPage(data, newPage),
        () => renderPage(data, state.currentPage + 1),
        fullConfig,
      );

      initFaqAccordion(block);
    };

    let currentData = filteredFaqData;

    const loadMore = () => {
      const gridEl = container.querySelector('.faq-grid');
      const currentCards = gridEl.querySelectorAll('.faq-card');
      const currentCount = currentCards.length;

      const newData = currentData.slice(currentCount, currentCount + state.pageSize);

      if (newData.length > 0) {
        newData.forEach((faqItem, index) => {
          const card = createFaqCard(faqItem, currentCount + index);
          gridEl.appendChild(card);
        });

        state.currentPage = Math.ceil(currentCount / state.pageSize) + 1;

        buildPaginationControls(container, { ...state, total: currentData.length, currentPage: state.currentPage }, (newPage) => {
          renderPage(currentData, newPage);
        }, fullConfig);
        buildMobilePaginationControls(container, { ...state, total: currentData.length, currentPage: state.currentPage }, loadMore, fullConfig);

        if (currentCount + newData.length >= currentData.length) {
          const mobileBtn = container.querySelector('.faq-pagination-mobile .page-button');
          if (mobileBtn) mobileBtn.style.display = 'none';
        }
      }

      initFaqAccordion(block);
    };

    renderFaqList(
      filteredFaqData.slice(0, state.pageSize),
      container,
      { ...state, total: filteredFaqData.length },
      (newPage) => renderPage(filteredFaqData, newPage),
      loadMore,
      fullConfig,
    );

    initTabSwitching(block, filteredFaqData, state, (filteredData) => {
      currentData = filteredData;

      const gridEl = container.querySelector('.faq-grid');
      if (gridEl) {
        gridEl.textContent = '';
      }

      const initialData = filteredData.slice(0, state.pageSize);
      initialData.forEach((faqItem, index) => {
        const card = createFaqCard(faqItem, index);
        gridEl.appendChild(card);
      });

      buildPaginationControls(container, { ...state, total: filteredData.length, currentPage: 1 }, (newPage) => {
        renderPage(filteredData, newPage);
      }, fullConfig);
      buildMobilePaginationControls(container, { ...state, total: filteredData.length, currentPage: 1 }, loadMore, fullConfig);

      initFaqAccordion(block);
    });
  }

  block.classList.add('loaded');
}
