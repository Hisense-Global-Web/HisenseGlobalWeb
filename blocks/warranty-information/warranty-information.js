import { getLocaleFromPath } from '../../scripts/locale-utils.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
function getWarrantyEndpoint(country, language, factoryModel, category, sku) {
  if (!country || !language || !factoryModel || !category) return '';
  const params = new URLSearchParams({
    country,
    language,
    factoryModel,
    category,
  });
  if (sku) {
    params.set('sku', sku);
  }
  return `/bin/hisense/support/document.json?${params.toString()}`;
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

  const shouldPrefixBaseUrl = ['/bin/', '/product/', '/content/dam/']
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

// function normalizeSupportResponse(data) {
//   return {
//     documentationTitle: data?.documentationTitle || 'Documentation',
//     documents: Array.isArray(data?.documents) ? data.documents : [],
//     warrantyTitle: data?.warrantyTitle || 'Warranty',
//     warranty: Array.isArray(data?.warranty) ? data.warranty : [],
//   };
// }

export default async function decorate(block) {
  const { country, language } = getLocaleFromPath();
  // let supportData = normalizeSupportResponse(null);
  let resWarrantyData = [];
  try {
    const warrantyEndpoint = getWarrantyEndpoint(
      country,
      language,
      'UXQUA',
      'televisions',
      '116UXQUA',
    );
    const warrantyResponse = await fetchJson(warrantyEndpoint);
    console.log('Fetched warranty data:', warrantyResponse);
    const tvObj = {
      product_category: 'Television',
      product_subcategory: 'Television',
      warranty_info_icon: 'http://localhost:3000/us/en/support/media_1412a0c4…4418.svg?width=2000&format=webply&optimize=medium',
      warranty_info_title: '2 Year Panel & Parts Warranty',
      warranty_info: '1',
      warranty_info_notes: '<ul><li>On-site service included for units 43" and above</li><li>Dead pixel policy: 3 or more bright/dead pixels qualifies for replacement</li><li>Original packaging recommended for service pickup</li></ul>',
      warranty_info_additional: 'Exchange Only',
    };
    const audioObj = {
      product_category: 'Audio',
      product_subcategory: 'Audio',
      warranty_info_icon: '🎵',
      warranty_info_title: '18 Month Audio Warranty',
      warranty_info: '2',
      warranty_info_notes: '<p><strong>Warranty Terms:</strong></p><p>• Physical damage, water exposure, and unauthorized repairs void coverage<br>• Ear pads, batteries, and cables: 90-day limited coverage</p>',
      warranty_info_additional: 'Exchange Only',
    };
    const laserObj = {
      product_category: 'Laser home cinema',
      product_subcategory: 'Laser home cinema',
      warranty_info_icon: '🎥',
      warranty_info_title: '3 Year Laser Projector Warranty',
      warranty_info: '1',
      warranty_info_notes: '<div style="background:#f9f9f9; padding:10px; border-radius:4px;"><strong>Included:</strong> Parts, labor, and firmware updates<br><strong>Not included:</strong> Remote control, HDMI cables, lens cleaning</div>',
      warranty_info_additional: 'Exchange Only',
    };
    const appliancesObj = {
      product_category: 'Appliances',
      product_subcategory: 'Refrigerators',
      warranty_info_icon: '❄️',
      warranty_info_title: '2 Year Full + 8 Year Sealed System Warranty',
      warranty_info: '3',
      warranty_info_notes: '<ul><li><b>Years 1-2:</b> Parts, labor, and transportation included</li><li><b>Years 3-10:</b> Compressor, condenser, evaporator parts only</li><li>Professional installation required for warranty validity</li></ul>',
      warranty_info_additional: 'Exchange Only',
    };
    const airObj = {
      product_category: 'Air products',
      product_subcategory: 'Air products',
      warranty_info_icon: '💨',
      warranty_info_title: '2 Year Air Purifier Warranty',
      warranty_info: '3.',
      warranty_info_notes: '<p><em>Filter replacements are not covered under warranty.</em></p><p>✔ HEPA filter: replace every 12 months<br>✔ Carbon pre-filter: replace every 6 months</p>',
      warranty_info_additional: 'Exchange Only',
    };
    const commercialObj = {
      product_category: 'Commercial',
      product_subcategory: 'Commercial Display',
      warranty_info_icon: '🖥️',
      warranty_info_title: '3 Year Commercial Display Warranty',
      warranty_info: '1',
      warranty_info_notes: '<div style="border-left:3px solid #0073aa; padding-left:12px;"><strong>Commercial Use Conditions:</strong><ul><li>24/7 operation supported — warranty valid for continuous use</li></ul></div>',
      warranty_info_additional: 'Exchange Only',
    };
    resWarrantyData = [
      {
        title: 'TV',
        // warranty:[tvObj]
        warranty: Array.from({ length: 9 }, () => tvObj),
      }, {
        title: 'Audio',
        warranty: [audioObj],
      }, {
        title: 'Laser home cinema',
        warranty: [laserObj],
      }, {
        title: 'Appliances',
        warranty: Array.from({ length: 12 }, () => appliancesObj),
      }, {
        title: 'Air products',
        warranty: [airObj],
      }, {
        title: 'Commercial',
        warranty: [commercialObj],
      }];
    // supportData = normalizeSupportResponse(supportResponse);
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
      numSpan.textContent = item.warranty_info;
      const unitSpan = document.createElement('span');
      unitSpan.className = 'card-unit';
      unitSpan.textContent = item.warranty_info_unit || 'Year';
      topLeft.append(numSpan, unitSpan);

      // card tips
      const exchangeDiv = document.createElement('div');
      exchangeDiv.className = 'exchange-div';
      exchangeDiv.textContent = item.warranty_info_additional;

      topLeftBox.append(topLeft, exchangeDiv);

      // card icon
      const cardIconBox = document.createElement('div');
      cardIconBox.className = 'card-icon-box';
      const cardIcon = document.createElement('img');
      cardIcon.src = item.warranty_info_icon;
      cardIconBox.append(cardIcon);

      cardTopBox.append(topLeftBox, cardIconBox);

      // card title
      const cardTitle = document.createElement('div');
      cardTitle.className = 'card-title';
      cardTitle.textContent = item.product_subcategory;
      // card notes
      const cardNotes = document.createElement('div');
      cardNotes.className = 'card-notes';
      cardNotes.innerHTML = item.warranty_info_notes;

      cardItem.append(cardTopBox, cardTitle, cardNotes);
      cardsGrid.append(cardItem);
    });
  }

  // 切换 tab 逻辑
  function switchTab(category) {
    currentPage = 1; // 切换 tab 时重置页码
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
    // 清空当前 card 列表
    cardsGrid.innerHTML = '';
    renderWarrantyCards();
    updateLoadMoreVisibility();
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

  // 窗口 resize 处理函数
  function resizeHandler() {
    currentPage = 1; // 切换时重置页码
    // 清空当前 card 列表
    cardsGrid.innerHTML = '';
    renderWarrantyCards(); // 重新渲染卡片
    updateLoadMoreVisibility(); // 更新Load More显示状态
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
      resizeHandler();
    }
    loadMoreNum(); // 初始调用设置正确的 loadMoreStep
    window.addEventListener('resize', () => loadMoreNum());
  }

  // 处理原始数据
  function originDataUtils() {
    originData = JSON.parse(JSON.stringify(resWarrantyData || []));
    // 所有 warranty 数据整合到一个数组中，方便后续渲染和分页处理
    originData.forEach((item) => {
      if (item.warranty && item.warranty.length > 0) {
        allWarrantyData.push(...item.warranty);
        showWarrantyData.push(...item.warranty);
      }
    });
    // 过滤所有 category
    allWarrantyCategory = originData.map((item) => item.title);
    // 如果有 all tab 文案，则添加到 category 列表首位
    if (allCategoryTabLabel) {
      allWarrantyCategory = [allCategoryTabLabel, ...allWarrantyCategory];
    }
    // 渲染 category tab
    renderCategoryTab();

    // 渲染 card list
    // renderWarrantyCards();
    // updateLoadMoreVisibility();
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
