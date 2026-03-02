import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_FAQ_ENDPOINT = '/faq/us/en/television.json';
const DEFAULT_TAGS_ENDPOINT = '/content/cq:tags/hisense/faq.-1.json';
const DEFAULT_PAGE_SIZE = 10;

/**
 * 每5分钟生成一次新的哈希值
 */
function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

/**
 * author 环境使用 GraphQL 路径，publish 环境使用 JSON 路径
 */
function getEndpointUrl(endpointPath) {
  const path = endpointPath || DEFAULT_FAQ_ENDPOINT;
  const hostname = window.location.hostname || '';
  const isAuthorEnv = hostname.includes('author-');

  let url;
  if (isAuthorEnv) {
    // Author 环境: 使用 GraphQL 接口
    const pathWithoutJson = path.replace(/\.json$/, '');
    const graphqlPath = `/graphql/execute.json/global/GetFaqByPath;path=/content/dam/hisense/content-fragments${pathWithoutJson}`;
    url = window.GRAPHQL_BASE_URL ? `${window.GRAPHQL_BASE_URL}${graphqlPath}` : graphqlPath;
  } else {
    // Publish 环境: 使用原有的 JSON 路径
    const baseUrl = window.GRAPHQL_BASE_URL || '';
    url = baseUrl ? `${baseUrl}${path}` : path;
  }

  // 5分钟缓存控制
  const fiveMinutesMs = 5 * 60 * 1000;
  const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
  const sep = url.indexOf('?') >= 0 ? '&' : '?';

  return `${url}${sep}_t=${cacheBuster}`;
}

/**
 * 获取标签接口 URL
 */
function getTagsEndpointUrl() {
  const baseUrl = window.GRAPHQL_BASE_URL || '';
  return baseUrl ? `${baseUrl}${DEFAULT_TAGS_ENDPOINT}` : DEFAULT_TAGS_ENDPOINT;
}

/**
 * 根据当前 URL 构建多国家语言的接口路径
 */
function getLocalizedEndpoint(configEndpoint) {
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
  const isAemEnv = hostname.includes('author') || hostname.includes('publish');

  // 如果是 AEM 环境，直接返回配置的 endpoint
  if (isAemEnv) {
    return configEndpoint;
  }

  const { pathname } = window.location;
  const segments = pathname.split('/').filter(Boolean);

  const country = segments[0] || 'us';
  let language;

  if (country.toLowerCase() === 'us') {
    language = 'en';
  } else {
    language = segments[1] || 'en';
  }

  const endpointSegments = configEndpoint.split('/').filter(Boolean);
  const lastSegment = endpointSegments[endpointSegments.length - 1] || 'television.json';

  return `/faq/${country}/${language}/${lastSegment}`;
}

/**
 * 提取 FAQ 列表
 */
function extractFaqList(data) {
  if (!data) return [];

  // 适配 GraphQL 返回格式: data.faqList.items
  if (data.data && data.data.faqList && Array.isArray(data.data.faqList.items)) {
    return data.data.faqList.items;
  }

  // 直接返回数组
  if (Array.isArray(data)) {
    return data;
  }

  // 适配 data.data 格式
  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }

  // 适配 items 格式
  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

/**
 * 获取 FAQ 标签数据
 */
async function fetchFaqTags() {
  try {
    const url = getEndpointUrl(getTagsEndpointUrl());
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

function renderFaqSummary(container, config, faqData, tags) {
  const summaryEl = document.createElement('div');
  summaryEl.className = 'faq-summary';

  // 标题
  if (config.title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'faq-summary-title';
    titleEl.textContent = config.title;
    summaryEl.appendChild(titleEl);
  }

  // 副标题
  if (config.subtitle) {
    const subtitleEl = document.createElement('div');
    subtitleEl.className = 'faq-summary-subtitle';
    subtitleEl.textContent = config.subtitle;
    summaryEl.appendChild(subtitleEl);
  }

  // 标签 tabs
  if (config.showTabs !== 'false' && Object.keys(tags).length > 0) {
    const tabsEl = renderFaqTabs(faqData, tags, config.allTabLabel || 'All');
    summaryEl.appendChild(tabsEl);
  }

  container.appendChild(summaryEl);
}

/**
 * 渲染标签 tabs
 */
function renderFaqTabs(faqData, tags, allTabLabel) {
  const tabsEl = document.createElement('div');
  tabsEl.className = 'faq-summary-tabs';

  // 统计每个标签的 FAQ 数量
  const tagCounts = {};
  const allTags = new Set();

  faqData.forEach((faq) => {
    if (Array.isArray(faq.tags)) {
      faq.tags.forEach((tag) => {
        // 提取标签名称， "hisense:faq/test-1" -> "test-1"
        const tagKey = tag.split('/').pop();
        allTags.add(tagKey);
        tagCounts[tagKey] = (tagCounts[tagKey] || 0) + 1;
      });
    }
  });

  // All tab
  const allTab = document.createElement('div');
  allTab.className = 'faq-summary-tab selected';
  allTab.textContent = `${allTabLabel} (${faqData.length})`;
  allTab.dataset.tag = 'all';
  tabsEl.appendChild(allTab);

  // 其他 tabs
  Object.keys(tags).forEach((tagKey) => {
    if (allTags.has(tagKey)) {
      const tab = document.createElement('div');
      tab.className = 'faq-summary-tab';
      tab.textContent = `${tags[tagKey]} (${tagCounts[tagKey] || 0})`;
      tab.dataset.tag = tagKey;
      tabsEl.appendChild(tab);
    }
  });

  return tabsEl;
}

/**
 * 创建 FAQ 卡片元素
 */
function createFaqCard(faqItem, index) {
  const card = document.createElement('div');
  card.className = index === 0 ? 'faq-card' : 'faq-card hide';
  card.dataset.tags = Array.isArray(faqItem.tags) ? faqItem.tags.join(',') : '';

  const title = document.createElement('div');
  title.className = 'faq-title';

  const titleContent = document.createElement('div');

  // 产品分类（如 "Television"）
  if (faqItem.productCategory) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'title-content';
    categoryDiv.textContent = faqItem.productCategory;
    titleContent.appendChild(categoryDiv);
  }

  // 问题标题
  if (faqItem.question) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'subtitle-content';
    questionDiv.textContent = faqItem.question;
    titleContent.appendChild(questionDiv);
  }

  const iconWrapper = document.createElement('div');
  const icon = document.createElement('img');
  icon.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
  icon.alt = '';
  icon.className = 'chevron';
  iconWrapper.appendChild(icon);

  title.appendChild(titleContent);
  title.appendChild(iconWrapper);

  const content = document.createElement('div');
  content.className = 'faq-content';

  const answerSpan = document.createElement('span');

  // 支持纯文本和 HTML 格式
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

/**
 * 构建分页控件
 */
function buildPaginationControls(container, state, onPageChange, config) {
  const { total, pageSize, currentPage } = state;

  const paginationEl = container.querySelector('.faq-pagination');
  if (!paginationEl) return;

  paginationEl.textContent = '';

  if (!total || !pageSize || total <= pageSize) {
    return;
  }

  const totalPages = Math.ceil(total / pageSize);
  const prevAriaLabel = config['prev-button-text'] || config.prevButtonText || 'Previous page';
  const nextAriaLabel = config['next-button-text'] || config.nextButtonText || 'Next page';

  const createButton = (label, page, disabled = false, isActive = false) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('page-button');

    if (label === 'prev') {
      const icon = document.createElement('img');
      icon.src = '/content/dam/hisense/us/common-icons/left.svg';
      icon.className = 'page-arrow is-prev normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = '/content/dam/hisense/us/common-icons/left-disabled.svg';
      disabledIcon.className = 'page-arrow is-prev disabled';
      btn.setAttribute('aria-label', prevAriaLabel);
      btn.append(icon, disabledIcon);
    } else if (label === 'next') {
      const icon = document.createElement('img');
      icon.src = '/content/dam/hisense/us/common-icons/right.svg';
      icon.className = 'page-arrow is-next normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = '/content/dam/hisense/us/common-icons/right-disabled.svg';
      disabledIcon.className = 'page-arrow is-next disabled';
      btn.setAttribute('aria-label', nextAriaLabel);
      btn.append(icon, disabledIcon);
    } else {
      btn.textContent = label;
    }

    if (isActive) btn.classList.add('is-active');
    if (disabled) {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => onPageChange(page));
    }
    return btn;
  };

  // Prev
  paginationEl.appendChild(
    createButton('prev', currentPage - 1, currentPage === 1),
  );

  const maxButtons = 5;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let end = start + maxButtons - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let page = start; page <= end; page += 1) {
    paginationEl.appendChild(
      createButton(String(page), page, false, page === currentPage),
    );
  }

  // Next
  paginationEl.appendChild(
    createButton('next', currentPage + 1, currentPage === totalPages),
  );
}

/**
 * 构建移动端分页控件（Load More）
 */
function buildMobilePaginationControls(container, state, onLoadMore, config) {
  const { total, pageSize, currentPage } = state;
  const mobilePaginationEl = container.querySelector('.faq-pagination-mobile');
  if (!mobilePaginationEl) return;

  mobilePaginationEl.textContent = '';

  if (!total || !pageSize || currentPage * pageSize >= total) {
    return;
  }

  const loadMoreText = config['load-more-text'] || config.loadMoreText || 'Load More';

  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.type = 'button';
  loadMoreBtn.classList.add('page-button');
  loadMoreBtn.textContent = loadMoreText;
  loadMoreBtn.addEventListener('click', onLoadMore);
  mobilePaginationEl.appendChild(loadMoreBtn);
}

/**
 * 渲染 FAQ 列表
 */
function renderFaqList(faqData, container, state, onPageChange, onLoadMore, config) {
  if (!container) return;

  const faqGrid = container.querySelector('.faq-grid');
  if (!faqGrid) return;

  // 清空现有内容
  faqGrid.textContent = '';

  // 如果没有数据，显示空状态
  if (!faqData || faqData.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'faq-empty';
    emptyMessage.textContent = 'No FAQ items available.';
    faqGrid.appendChild(emptyMessage);
    return;
  }

  // 渲染 FAQ 卡片
  faqData.forEach((faqItem, index) => {
    const card = createFaqCard(faqItem, index);
    faqGrid.appendChild(card);
  });

  // 构建分页控件
  if (state.pagination !== 'false') {
    buildPaginationControls(container, state, onPageChange, config);
    buildMobilePaginationControls(container, state, onLoadMore, config);
  }
}

/**
 * 初始化 FAQ 手风琴功能
 */
function initFaqAccordion(block) {
  const faqTitles = block.querySelectorAll('.faq-card .faq-title');

  faqTitles.forEach((title) => {
    title.addEventListener('click', (e) => {
      e.stopPropagation();
      const faqCard = title.closest('.faq-card');
      if (faqCard) {
        faqCard.classList.toggle('hide');
      }
    });
  });
}

/**
 * 初始化标签 tab 切换功能
 */
function initTabSwitching(block, allFaqData, state, renderCallback) {
  const tabs = block.querySelectorAll('.faq-summary-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // 更新选中状态
      tabs.forEach((t) => t.classList.remove('selected'));
      tab.classList.add('selected');

      // 过滤 FAQ
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

      // 重置分页状态
      state.currentPage = 1;
      state.total = filteredData.length;

      // 重新渲染
      renderCallback(filteredData);
    });
  });
}

export default async function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  const config = readBlockConfig(block);

  // 读取配置
  const configuredEndpoint = config.endpoint || DEFAULT_FAQ_ENDPOINT;
  const pageSize = parseInt(config['page-size'] || config.pageSize || DEFAULT_PAGE_SIZE, 10);
  const showTabs = config.showTabs !== 'false';
  const allTabLabel = config['all-tab-label'] || config.allTabLabel || 'All';
  const title = config.title || '';
  const subtitle = config.subtitle || '';

  // 构建本地化接口路径
  const endpoint = getLocalizedEndpoint(configuredEndpoint);

  // 分页状态
  const state = {
    pageSize,
    pagination: config.pagination !== 'false',
    currentPage: 1,
    total: 0,
  };

  // 创建 FAQ 容器
  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement('div');
  wrapper.className = 'faq-module-wrapper';

  // FAQ grid
  const faqGrid = document.createElement('div');
  faqGrid.className = 'faq-grid';
  wrapper.appendChild(faqGrid);

  // 分页容器
  if (state.pagination) {
    const paginationEl = document.createElement('div');
    paginationEl.className = 'faq-pagination';
    wrapper.appendChild(paginationEl);
  }

  // 分页容器（移动端）
  if (state.pagination) {
    const mobilePaginationEl = document.createElement('div');
    mobilePaginationEl.className = 'faq-pagination-mobile';
    wrapper.appendChild(mobilePaginationEl);
  }

  fragment.appendChild(wrapper);

  if (isEditMode) {
    // 编辑模式：保留原始结构
    const aside = document.createElement('aside');
    aside.className = 'faq-module';
    [...block.attributes].forEach((attr) => {
      if (attr.name.startsWith('data-aue-')) {
        aside.setAttribute(attr.name, attr.value);
      }
    });
    aside.appendChild(fragment);
    block.replaceChildren(aside);
  } else {
    block.className = 'faq-module';
    block.replaceChildren(fragment);
  }

  // 获取 FAQ 数据
  let allFaqData = [];
  let tags = {};

  // 完整的配置对象
  const fullConfig = {
    title,
    subtitle,
    showTabs,
    allTabLabel,
    pageSize,
    pagination: state.pagination,
    prevButtonText: config['prev-button-text'] || config.prevButtonText || '',
    nextButtonText: config['next-button-text'] || config.nextButtonText || '',
    loadMoreText: config['load-more-text'] || config.loadMoreText || 'Load More',
  };

  try {
    // 并行获取 FAQ 数据和标签数据
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

  // 设置总数
  state.total = allFaqData.length;

  // 渲染摘要区域
  const container = block.querySelector('.faq-module-wrapper');
  if (container) {
    renderFaqSummary(
      container,
      {
        title,
        subtitle,
        showTabs,
        allTabLabel,
      },
      allFaqData,
      tags,
    );

    // 分页渲染函数
    const renderPage = (data, page = 1) => {
      state.currentPage = page;
      const displayData = state.pagination ? data.slice((page - 1) * state.pageSize, page * state.pageSize) : data;

      renderFaqList(
        displayData,
        container,
        state,
        (newPage) => renderPage(data, newPage),
        () => renderPage(data, state.currentPage + 1),
        fullConfig,
      );

      // 初始化手风琴交互
      initFaqAccordion(block);
    };

    // 禁用分页时显示所有数据，启用分页时显示第一页
    const initialData = state.pagination ? allFaqData.slice(0, state.pageSize) : allFaqData;
    renderFaqList(
      initialData,
      container,
      state,
      (newPage) => {
        const start = (newPage - 1) * state.pageSize;
        const end = start + state.pageSize;
        const pageData = allFaqData.slice(start, end);
        renderFaqList(
          pageData,
          container,
          { ...state, currentPage: newPage },
          (p) => {
            const s = (p - 1) * state.pageSize;
            const e = s + state.pageSize;
            renderFaqList(
              allFaqData.slice(s, e),
              container,
              { ...state, currentPage: p },
              (np) => {
                const ns = (np - 1) * state.pageSize;
                const ne = ns + state.pageSize;
                renderFaqList(
                  allFaqData.slice(ns, ne),
                  container,
                  { ...state, currentPage: np },
                  () => {},
                  () => {},
                  fullConfig,
                );
              },
              () => {},
              fullConfig,
            );
          },
          () => {},
          fullConfig,
        );
      },
      () => {
        const nextPage = state.currentPage + 1;
        const start = nextPage * state.pageSize;
        const end = start + state.pageSize;
        renderFaqList(
          allFaqData.slice(0, end),
          container,
          { ...state, currentPage: nextPage },
          () => {},
          () => {},
          fullConfig,
        );
      },
      fullConfig,
    );

    // 初始化标签切换
    initTabSwitching(block, allFaqData, state, (filteredData) => {
      // 禁用分页时显示所有过滤后的数据，启用分页时显示第一页
      const displayData = state.pagination ? filteredData.slice(0, state.pageSize) : filteredData;
      renderFaqList(
        displayData,
        container,
        { ...state, total: filteredData.length, currentPage: 1 },
        () => {},
        () => {},
        fullConfig,
      );
      initFaqAccordion(block);
    });
  }

  // 标记为已加载
  block.classList.add('loaded');
}
