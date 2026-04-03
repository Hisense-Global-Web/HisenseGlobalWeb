import { getLocaleFromPath } from '../../scripts/locale-utils.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
function isAemEnvironment() {
  const hostname = window.location.hostname || '';
  return hostname.includes('author') || hostname.includes('publish');
}

function getWarrantyEndpoint(country, language) {
  if (!country || !language) return '';
  const params = new URLSearchParams({
    country,
    language,
  });
  if (isAemEnvironment()) {
    return `/bin/hisense/warranty?${params.toString()}`;
  }

  return `/warranty/${country}/${language}.json`;
}

function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

function getCacheBustedUrl(url) {
  if (!url) return '';
  const cacheBuster = simpleHash(Math.floor(Date.now() / FIVE_MINUTES_MS));
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${cacheBuster}`;
}

function getBaseUrl() {
  return window.GRAPHQL_BASE_URL || '';
}

function toAbsoluteUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const shouldPrefixBaseUrl = ['/bin/', '/warranty/']
    .some((prefix) => path.startsWith(prefix));
  if (!shouldPrefixBaseUrl) return path;

  const baseUrl = getBaseUrl();
  if (!baseUrl) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchJson(path) {
  if (!path) return null;

  const url = getCacheBustedUrl(toAbsoluteUrl(path));
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export default async function decorate(block) {
  const { country, language } = getLocaleFromPath();
  let resWarrantyData = [];
  try {
    const warrantyEndpoint = getWarrantyEndpoint(
      country,
      language,
    );
    const warrantyResponse = await fetchJson(warrantyEndpoint);
    resWarrantyData = warrantyResponse?.data || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('product-resources: failed to fetch warranty data', error);
  }

  const warrantyWrapper = document.createElement('div');
  warrantyWrapper.className = 'warranty-wrapper';
  // category tab 切换盒子
  const warrantyCategoryTabs = document.createElement('ul');
  warrantyCategoryTabs.className = 'warranty-category-box';
  // warranty cards 盒子
  const cardsBox = document.createElement('div');
  cardsBox.className = 'warranty-cards-box';
  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'warranty-cards';
  const warrantyLoadMore = document.createElement('div');
  warrantyLoadMore.className = 'warranty-load-more';
  let currentPage = 1; // 当前页码
  let loadMoreStep = 9; // 分布数量
  let loadMoreTextContent = null;
  let allCategoryTabLabel = null;
  let originData = []; // 原始数据
  let showWarrantyData = []; // 当前展示的数据
  const allWarrantyData = []; // 存储所有聚合后的数据
  let allWarrantyCategory = []; // 所有 warranty category

  const rows = [...(block.children || [])];
  rows.forEach((row, index) => {
    if (index === 0) {
      // 获取 warranty tab 文案
      const tabText = row.textContent && row.textContent.trim();
      if (tabText) {
        // 假设文案格式为 "Warranty Tab: TV, Audio, Appliances"
        allCategoryTabLabel = tabText;
      }
    } else if (index === 1) {
      // 获取 load more 文案
      const text = row.textContent && row.textContent.trim();
      if (text) {
        loadMoreTextContent = text;
      }
    }
  });

  const moreSpan = document.createElement('span');
  moreSpan.textContent = loadMoreTextContent || 'Load more';
  warrantyLoadMore.append(moreSpan);

  cardsBox.append(cardsGrid, warrantyLoadMore);
  warrantyWrapper.append(warrantyCategoryTabs, cardsBox);
  block.replaceChildren(warrantyWrapper);

  // 新增：更新Load More按钮显示状态
  function updateLoadMoreVisibility() {
    const totalPages = Math.ceil(showWarrantyData.length / loadMoreStep);
    if (currentPage >= totalPages) {
      warrantyLoadMore.style.display = 'none';
    } else {
      warrantyLoadMore.style.display = 'block';
    }
  }

  // 渲染 warranty card item
  function renderWarrantyCards() {
    const start = (currentPage - 1) * loadMoreStep;
    const end = start + loadMoreStep;
    const renderAllData = showWarrantyData.slice(start, end);
    renderAllData.forEach((item) => {
      const cardItem = document.createElement('div');
      cardItem.className = 'card-item';
      const cardTopBox = document.createElement('div');
      cardTopBox.className = 'card-top-box';

      // card num
      const topLeftBox = document.createElement('div');
      topLeftBox.className = 'top-left-box';
      const topLeft = document.createElement('div');
      topLeft.className = 'top-left';
      const numSpan = document.createElement('span');
      numSpan.className = 'card-num';
      numSpan.textContent = item.warrantyYearNumber;
      const unitSpan = document.createElement('span');
      unitSpan.className = 'card-unit';
      unitSpan.textContent = item.warrantyYearLabel || '';
      topLeft.append(numSpan, unitSpan);

      // card tips
      const exchangeDiv = document.createElement('div');
      exchangeDiv.className = 'exchange-div';
      exchangeDiv.textContent = item.warrantyInfoAdditional;

      topLeftBox.append(topLeft, exchangeDiv);

      // card icon
      const cardIconBox = document.createElement('div');
      cardIconBox.className = 'card-icon-box';
      const cardIcon = document.createElement('img');
      cardIcon.src = item.warrantyInfoIcon || '';
      cardIconBox.append(cardIcon);

      cardTopBox.append(topLeftBox, cardIconBox);

      // card title
      const cardTitle = document.createElement('div');
      cardTitle.className = 'card-title';
      cardTitle.textContent = item.productSubcategory;
      // card notes
      const cardNotes = document.createElement('div');
      cardNotes.className = 'card-notes';
      cardNotes.innerHTML = item.warrantyInfoNotes;

      cardItem.append(cardTopBox, cardTitle, cardNotes);
      cardsGrid.append(cardItem);
    });
  }

  // resetRenderHandler 用于切换 tab or 窗口大小变化 时重置页码、清空当前 card 列表并重新渲染
  function resetRenderHandler() {
    currentPage = 1; // 切换时重置页码
    // 清空当前 card 列表
    cardsGrid.innerHTML = '';
    renderWarrantyCards(); // 重新渲染卡片
    updateLoadMoreVisibility(); // 更新Load More显示状态
  }

  // 切换 tab 逻辑
  function switchTab(category) {
    // 更新 active 样式
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach((item) => {
      if (item.getAttribute('data-category') === category) {
        item.classList.add('category-item-active');
      } else {
        item.classList.remove('category-item-active');
      }
    });
    // 根据 category 过滤数据并渲染 card
    if (category === allCategoryTabLabel) {
      showWarrantyData = allWarrantyData;
    } else {
      showWarrantyData = [];
      originData.forEach((item) => {
        if (item.title === category) {
          showWarrantyData.push(...item.warranty);
        }
      });
    }
    resetRenderHandler();
  }

  // 渲染 category tab dom
  function renderCategoryTab() {
    allWarrantyCategory.forEach((item, index) => {
      const categoryItem = document.createElement('li');
      categoryItem.className = 'category-item';
      categoryItem.textContent = item;
      categoryItem.setAttribute('data-category', item);
      if (index === 0) {
        categoryItem.classList.add('category-item-active');
      }
      categoryItem.addEventListener('click', () => switchTab(categoryItem.getAttribute('data-category')));
      warrantyCategoryTabs.append(categoryItem);
    });
  }

  // 获取动态 loadMoreStep 并设置监听窗口变化
  function getDynamicLoadMoreStep() {
    function loadMoreNum() {
      const screenWidth = window.innerWidth;
      if (screenWidth < 860) {
        loadMoreStep = 5; // 手机显示5条
      } else {
        loadMoreStep = 9; // 桌面显示9条
      }
      resetRenderHandler();
    }
    loadMoreNum(); // 初始调用设置正确的 loadMoreStep
    window.addEventListener('resize', () => loadMoreNum());
  }

  // 过滤无效 warranty 数据的函数
  function filterValidWarrantyData(data) {
    return data.map((item) => {
      if (!item.warranty || !Array.isArray(item.warranty)) {
        return { ...item, warranty: [] };
      }

      // 过滤有效的 warranty 数据
      const validWarranty = item.warranty.filter((warrantyItem) => {
        // eslint-disable-next-line no-underscore-dangle
        if (!warrantyItem._path) return false;

        // 删除最后一个 '/' 之后的所有内容
        // eslint-disable-next-line no-underscore-dangle
        const lastSlashIndex = warrantyItem._path.lastIndexOf('/');
        // eslint-disable-next-line no-underscore-dangle
        let processedPath = warrantyItem._path;
        if (lastSlashIndex !== -1) {
          // eslint-disable-next-line no-underscore-dangle
          processedPath = warrantyItem._path.substring(0, lastSlashIndex);
        }

        // 检查处理后的路径是否以 '/warranty' 结尾
        // 如果是，则为无效数据（返回 false 过滤掉）
        if (processedPath.endsWith('/warranty')) {
          return false; // 无效数据
        }

        return true; // 有效数据
      });

      return {
        ...item,
        warranty: validWarranty,
      };
    }).filter((item) => item.warranty.length > 0); // 只保留至少有一条有效 warranty 数据的对象
  }

  // 处理原始数据
  function originDataUtils() {
    originData = JSON.parse(JSON.stringify(resWarrantyData || []));
    // 过滤有效数据
    const validDataArr = filterValidWarrantyData(originData);

    // 过滤所有 category
    allWarrantyCategory = validDataArr.map((item) => item.title);
    // 如果有 all tab 文案，则添加到 category 列表首位
    if (allCategoryTabLabel) {
      allWarrantyCategory = [allCategoryTabLabel, ...allWarrantyCategory];
    }
    // 渲染 category tab
    renderCategoryTab();

    // 所有 warranty 数据整合到一个数组中，方便后续渲染和分页处理
    validDataArr.forEach((item) => {
      if (item.warranty && item.warranty.length > 0) {
        allWarrantyData.push(...item.warranty);
        if (allCategoryTabLabel) {
          // 如果有 all tab 文案，默认展示 all tab 数据
          showWarrantyData.push(...item.warranty);
        } else if (item.title === allWarrantyCategory[0]) {
          // 没有 all tab 文案，则默认展示第一个 category 的数据
          showWarrantyData.push(...item.warranty);
        }
      }
    });

    // 渲染 card list
    // 获取动态 loadMoreStep 并设置监听窗口变化
    getDynamicLoadMoreStep();
  }

  // 修改：Load More 点击逻辑
  warrantyLoadMore.addEventListener('click', () => {
    currentPage += 1;
    // eslint-disable-next-line no-use-before-define
    renderWarrantyCards();
    // 更新Load More显示状态
    // eslint-disable-next-line no-use-before-define
    updateLoadMoreVisibility();
  });

  function initRenderDom() {
    originDataUtils();
  }

  initRenderDom();
}
