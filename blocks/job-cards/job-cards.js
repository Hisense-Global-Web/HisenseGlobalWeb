import { isMobileWindow } from '../../scripts/device.js';
import { getLocaleFromPath, localizeProductApiPath } from '../../scripts/locale-utils.js';
import {
  renderCompareDetailData,
  aggregateData,
  createComparePopup,
  createCompareLiEl,
  compareLiAppendType,
} from '../../utils/plp-compare-utils.js';

const { country } = getLocaleFromPath();
function applyAggregatedSort(sortProperty, direction = -1) {
  try {
    // 检查是否有已选中的 filter
    const hasActiveFilters = () => {
      const filterTags = document.querySelectorAll('.plp-filter-tag');
      return filterTags && filterTags.length > 0;
    };

    // 如果有筛选结果，就在筛选结果基础上排序，否则使用原始数据进行排序
    let listToSort;
    if (hasActiveFilters()) {
      // 使用当前筛选结果进行排序
      listToSort = window.filteredProducts.slice();
    } else if (Array.isArray(window.productData)) {
      // 使用全部产品数据进行排序
      listToSort = window.productData.slice();
    } else {
      listToSort = [];
    }

    // 通过 key 获取 product model
    const getPropertyByKey = (item, propKey) => {
      if (!item || !propKey) return undefined;
      if (Object.prototype.hasOwnProperty.call(item, propKey)) return item[propKey];
      const parts = propKey.includes('.') ? propKey.split('.') : propKey.split('_');
      return parts.reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), item);
    };

    // 序列化属性，排序属性的值类型中包含尺寸，时间，价格
    const normalizeValueForSort = (value) => {
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

    // factoryModel 分组，计算每个组在指定属性上的最大
    const groupedByFactoryModel = {};
    const factoryModelMaxValues = {};

    listToSort.forEach((item) => {
      const { factoryModel } = item;
      if (!groupedByFactoryModel[factoryModel]) {
        groupedByFactoryModel[factoryModel] = [];
      }
      groupedByFactoryModel[factoryModel].push(item);

      // 计算factoryModel 在指定属性上的最大
      const value = normalizeValueForSort(getPropertyByKey(item, sortProperty));
      if (value !== null && value !== undefined) {
        if (!factoryModelMaxValues[factoryModel]
            || (typeof value === 'number' && typeof factoryModelMaxValues[factoryModel] === 'number' && value > factoryModelMaxValues[factoryModel])
            || (typeof value === 'string' && typeof factoryModelMaxValues[factoryModel] === 'string' && String(value).localeCompare(String(factoryModelMaxValues[factoryModel])) > 0)) {
          factoryModelMaxValues[factoryModel] = value;
        }
      }
    });

    const getProductSeries = (item) => {
      if (!item) return '';
      if (item.series) return item.series;
      return item.sku || '';
    };

    // 按最大值进行排序，当最大值相同时按标题Z-A排序
    const sortedProducts = listToSort.slice().sort((a, b) => {
      const maxValueA = factoryModelMaxValues[a.factoryModel];
      const maxValueB = factoryModelMaxValues[b.factoryModel];

      // 处理空值
      if (maxValueA === null || maxValueA === undefined) return 1 * direction;
      if (maxValueB === null || maxValueB === undefined) return -1 * direction;

      // 比较最大
      let compareResult = 0;
      if (maxValueA === maxValueB) {
        // 先按首字母Z-A排序，首字母相同再按数字9-0排序
        const titleA = getProductSeries(a);
        const titleB = getProductSeries(b);

        // 先按首字母Z-A排序
        const firstCharA = String(titleA).charAt(0).toUpperCase();
        const firstCharB = String(titleB).charAt(0).toUpperCase();
        const charCompare = firstCharB.localeCompare(firstCharA); // Z-A排序

        if (charCompare !== 0) {
          compareResult = charCompare;
        } else {
          // 首字母相同，比较第二个字符，字母排在数字前面
          const secondCharA = String(titleA).charAt(1);
          const secondCharB = String(titleB).charAt(1);
          const isAlphaA = /^[A-Z]/i.test(secondCharA);
          const isAlphaB = /^[A-Z]/i.test(secondCharB);

          if (isAlphaA !== isAlphaB) {
            // 一个是字母，一个是数字，字母排在前面
            compareResult = isAlphaA ? -1 : 1;
          } else {
            // 都是字母或都是数字，按数字9-0排序
            const numA = parseFloat(titleA.replace(/[^\d.]/g, '')) || 0;
            const numB = parseFloat(titleB.replace(/[^\d.]/g, '')) || 0;
            compareResult = numB - numA; // 数字大的在前
          }
        }
      } else if (typeof maxValueA === 'number' && typeof maxValueB === 'number') {
        compareResult = (maxValueA - maxValueB) * direction;
      } else {
        compareResult = String(maxValueA).localeCompare(String(maxValueB)) * direction;
      }

      return compareResult;
    });

    // 如果是按尺寸排序，设置标志表示产品卡片应默认选中最大尺寸
    if (!sortProperty || sortProperty === 'size') {
      window.isDefaultSortApplied = true;
    } else {
      window.isDefaultSortApplied = false;
    }

    window.renderPlpProducts(sortedProducts);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn('Aggregated sort error:', e);
  }
}
export default function decorate(block) {
  const isEditMode = block && block.hasAttribute && block.hasAttribute('data-aue-resource');

  const rows = [...(block.children || [])];
  let graphqlUrl = null;
  let graphqlResource = null;
  let fields = [];
  let fieldsResource = null;
  let loadMoreTextContent = null;
  let noResultMessage = null;
  let departmentIcon = '';
  let locationIcon = '';
  let experienceIcon = '';
  let salaryRangeIcon = '';

  rows.forEach((row, index) => {
    const resource = row.getAttribute && row.getAttribute('data-aue-resource');
    const anchor = row.querySelector && row.querySelector('a');
    const text = row.textContent && row.textContent.trim();

    if (index === 0) {
      // 第一行：graphqlUrl
      if (anchor) {
        graphqlUrl = anchor.getAttribute('href') || anchor.textContent.trim();
        graphqlResource = resource || anchor.getAttribute('data-aue-resource') || null;
      } else if (text) {
        graphqlUrl = text;
        graphqlResource = resource;
      }
    } else if (index === 1) {
      // 第二行：fields
      if (text && text.indexOf(',') >= 0) {
        fields = text.split(',').map((s) => s.trim()).filter(Boolean);
        fieldsResource = resource;
      }
    } else if (index === 2) {
      departmentIcon = row.querySelector('img')?.src;
    } else if (index === 3) {
      locationIcon = row.querySelector('img')?.src;
    } else if (index === 4) {
      experienceIcon = row.querySelector('img')?.src;
    } else if (index === 5) {
      salaryRangeIcon = row.querySelector('img')?.src;
    } else if (index === 6) {
      // 第三行：loadMoreTextContent
      if (text) {
        loadMoreTextContent = text;
      } else {
        loadMoreTextContent = 'Load More';
      }
    } else if (index === 7) {
      // 第五行：noResultMessage
      if (text) {
        noResultMessage = row.innerHTML;
      }
    }
  });

  rows.forEach((row) => {
    if (row && row.parentNode) row.parentNode.removeChild(row);
  });

  const productsBox = document.createElement('div');
  productsBox.className = 'job-cards-box';
  const productsGrid = document.createElement('div');
  productsGrid.className = 'job-cards-list';
  const productsLoadMore = document.createElement('div');
  productsLoadMore.className = 'plp-load-more';
  // 新增：分页相关状态
  let currentPage = 1;
  const loadMoreStep = 10;
  let allGroupedData = []; // 存储所有聚合后的产品数据
  let compareDataArr = []; // 存储比较的产品数据

  // 修改：Load More 点击逻辑
  productsLoadMore.addEventListener('click', () => {
    currentPage += 1;
    // eslint-disable-next-line no-use-before-define
    renderPagedItems();
    // 更新Load More显示状态
    // eslint-disable-next-line no-use-before-define
    updateLoadMoreVisibility();
  });

  const span = document.createElement('span');
  span.textContent = loadMoreTextContent || 'Load More';

  const productsNoResult = document.createElement('div');
  productsNoResult.className = 'job-cards-no-result';
  productsNoResult.innerHTML = noResultMessage || '<p>no result</p>';
  productsNoResult.style.display = 'none';

  productsLoadMore.append(span);
  productsBox.append(productsGrid);
  productsBox.append(productsLoadMore);
  productsBox.append(productsNoResult);

  if (isEditMode) {
    const topWrapper = document.createElement('div');

    const btnRow = document.createElement('div');
    const p = document.createElement('p');
    p.className = 'button-container';
    const a = document.createElement('a');
    a.className = 'button';
    a.title = graphqlUrl || '';
    a.href = graphqlUrl || '#';
    a.textContent = graphqlUrl || '';
    if (graphqlResource) {
      a.setAttribute('data-aue-resource', graphqlResource);
    }

    p.appendChild(a);
    btnRow.appendChild(p);
    topWrapper.appendChild(btnRow);

    const fieldsRow = document.createElement('div');
    const fieldsInner = document.createElement('div');
    const pf = document.createElement('p');
    pf.textContent = fields.join(',');
    fieldsInner.appendChild(pf);
    if (fieldsResource) fieldsInner.setAttribute('data-aue-resource', fieldsResource);
    fieldsRow.appendChild(fieldsInner);
    topWrapper.appendChild(fieldsRow);

    block.replaceChildren(topWrapper, productsBox);
  } else {
    block.replaceChildren(productsBox);
  }

  if (!graphqlUrl) return;

  // 页面底部固定栏，比较商品固定栏
  function fixedBottomCompareBar() {
    const compareBarEl = document.createElement('div');
    compareBarEl.className = 'plp-compare-bar';
    const compareCardList = document.createElement('ul');
    compareCardList.className = 'plp-compare-cards';

    // add compare button and compare bar close button
    const compareBtnEl = document.createElement('div');
    compareBtnEl.className = 'plp-compare-btn';
    compareBtnEl.textContent = 'Compare';
    // 显示对比详细信息弹窗
    compareBtnEl.addEventListener('click', () => {
      document.body.style.overflow = 'hidden';
      // 比较商品信息详细数据
      const compareDetailInfo = aggregateData(compareDataArr);
      // 每次点击 compare 按钮，重新渲染比较商品信息 popup
      createComparePopup();
      // render compare popup detail data
      renderCompareDetailData(compareDetailInfo, 'property-box-id');
      // document.querySelector('.compare-popup-wrapper').style.display = 'block';
      document.querySelector('.compare-popup-wrapper').style.visibility = 'visible';
    });
    const compareBarCloseBtn = document.createElement('img');
    compareBarCloseBtn.className = 'plp-compare-bar-close';
    compareBarCloseBtn.src = `/content/dam/hisense/${country}/common-icons/close-50.svg`;
    compareBarCloseBtn.alt = 'Close';
    // 底部固定栏上的关闭按钮点击事件
    compareBarCloseBtn.addEventListener('click', () => {
      compareBarEl.classList.remove('compare-bar-show');
      // 重置比较数据为空
      compareDataArr = [];
      // 所有 product card 【Compare】按钮取消选中状态
      const cardCompareBtnAll = document.querySelectorAll('.compare-checked');
      cardCompareBtnAll.forEach((item) => {
        item.classList.remove('compare-checked');
      });
      // 重置底部比较栏dom 元素
      const compareBarLiAll = document.querySelectorAll('.plp-compare-cards li');
      compareBarLiAll.forEach((resetLi) => {
        resetLi.classList.remove('active-compare');
        resetLi.setAttribute('data-compare-id', '');
        resetLi.querySelector('.compare-img-box img').src = '';
        resetLi.querySelector('.compare-product-title').textContent = '';
      });
      if (isMobileWindow()) {
        const footerWrapper = document.querySelector('.footer-wrapper');
        footerWrapper.style.paddingBottom = 0;
      }
    });

    compareBarEl.append(compareCardList, compareBtnEl, compareBarCloseBtn);
    // const mainEl = document.querySelector('main');
    // mainEl.appendChild(compareBarEl);
    document.body.appendChild(compareBarEl);
    // 为询问固定栏，初始化追加三个li 元素
    createCompareLiEl(compareLiAppendType.initCompareLi);
  }

  function applyDefaultSort() {
    // 检查是否有已选中的 filter（通过 plp-filter-tag 或选中的 input）
    const hasActiveFilters = () => {
      // 检查是否有 plp-filter-tag
      const filterTags = document.querySelectorAll('.plp-filter-tag');
      if (filterTags && filterTags.length > 0) return true;
      // 检查是否有选中的 filter input
      const checkedInputs = document.querySelectorAll('.plp-filter-item input[data-option-value]:checked');
      return checkedInputs && checkedInputs.length > 0;
    };

    const sortAndApplyFilters = () => {
      const selectedSortOption = document.querySelector('.plp-sort-option.selected');
      if (selectedSortOption) {
        const sortValue = selectedSortOption.dataset.value
            || selectedSortOption.getAttribute('data-value')
            || '';
        if (sortValue && sortValue.trim()) {
          if (window.applyPlpSort) {
            window.applyPlpSort(sortValue);
          } else {
            applyAggregatedSort('size', -1);
          }
        } else {
          applyAggregatedSort('size', -1);
        }
      } else {
        applyAggregatedSort('size', -1);
      }
    };

    if (hasActiveFilters()) {
      // 如果有已选中的 filter，先应用筛选（筛选内部会处理排序）
      if (window.applyPlpFilters) {
        window.applyPlpFilters();
      } else {
        sortAndApplyFilters();
      }
    } else {
      // 没有筛选条件，直接排序
      sortAndApplyFilters();
    }
  }

  function applyUrlFilters() {
    try {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search);

      // 遍历所有URL参数
      urlParams.forEach((paramValue, paramName) => {
        if (paramValue) {
          // 直接使用参数名和值组合成筛选条目
          const targetValue = `${paramName}/${paramValue}`;
          const targetCheckbox = document.querySelector(`.plp-filter-item input[value$="${targetValue}"]`);
          // const targetCheckbox = document.querySelector(`.product-filter-item[data-tag="${targetValue}"]`);

          if (targetCheckbox) {
            // 触发checkbox的点击事件
            targetCheckbox.click();

            // 展开对应的筛选组
            const filterGroup = targetCheckbox.closest('.plp-filter-group');
            if (filterGroup && filterGroup.classList.contains('hide')) {
              filterGroup.classList.remove('hide');
            }
          }
        }
      });
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn('URL filter error:', e);
    }
  }

  // 新增：更新Load More按钮显示状态
  function updateLoadMoreVisibility() {
    const totalPages = Math.ceil(allGroupedData.length / loadMoreStep);
    if (currentPage >= totalPages) {
      productsLoadMore.style.display = 'none';
    } else {
      productsLoadMore.style.display = 'block';
    }
  }

  // 新增：渲染分页后的产品
  function renderPagedItems() {
    const start = (currentPage - 1) * loadMoreStep;
    const end = start + loadMoreStep;
    const pagedGroupedArray = allGroupedData.slice(start, end);

    // 渲染当前页的产品卡片（追加模式）
    pagedGroupedArray.forEach((group) => {
      const item = group.representative;
      const card = document.createElement('div');
      card.className = 'job-item-card';

      const jobInfoGroupEl = document.createElement('div');
      jobInfoGroupEl.className = 'job-info-group';

      const jobTitleEl = document.createElement('div');
      jobTitleEl.className = 'job-title-group';
      const titleSpanEl = document.createElement('span');
      titleSpanEl.className = 'job-title';
      const rightIcon = document.createElement('img');
      rightIcon.className = 'right-icon';
      rightIcon.src = '/content/dam/hisense/us/common-icons/chevron-right.svg';
      titleSpanEl.textContent = item.jobTitle;
      titleSpanEl.append(rightIcon);
      const jobTimeTypeEl = document.createElement('span');
      jobTimeTypeEl.className = 'job-time-type';
      jobTimeTypeEl.textContent = item.jobType;

      jobTitleEl.append(titleSpanEl, jobTimeTypeEl);

      const jobDetailEl = document.createElement('div');
      jobDetailEl.className = 'job-detail';
      const departmentEl = document.createElement('div');
      const hasDepartment = fields?.includes('department');
      departmentEl.className = `job-info-item ${hasDepartment ? '' : 'hidden'}`;
      const img1 = document.createElement('img');
      img1.src = departmentIcon;
      const span1 = document.createElement('span');
      span1.textContent = item.department;
      departmentEl.append(img1, span1);
      const locationEl = document.createElement('div');
      const hasLocation = fields?.includes('location');
      locationEl.className = `job-info-item ${hasLocation ? '' : 'hidden'}`;
      const img2 = document.createElement('img');
      img2.src = locationIcon;
      const span2 = document.createElement('span');
      span2.textContent = item.workLocation;
      locationEl.append(img2, span2);
      const experienceEl = document.createElement('div');
      const hasExperience = fields?.includes('experience');
      experienceEl.className = `job-info-item ${hasExperience ? '' : 'hidden'}`;
      const img3 = document.createElement('img');
      img3.src = experienceIcon;
      const span3 = document.createElement('span');
      span3.textContent = item.experienceRequirement;
      experienceEl.append(img3, span3);
      const salaryRangeEl = document.createElement('div');
      const hasSalaryRange = fields?.includes('salary-range');
      salaryRangeEl.className = `job-info-item ${hasSalaryRange ? '' : 'hidden'}`;
      const img4 = document.createElement('img');
      img4.src = salaryRangeIcon;
      const span4 = document.createElement('span');
      span4.textContent = item.salary;
      salaryRangeEl.append(img4, span4);
      jobDetailEl.append(departmentEl, locationEl, experienceEl, salaryRangeEl);

      const jobDateEl = document.createElement('div');
      jobDateEl.className = 'job-date';
      const postDate = new Date(item.jobPostedTime);
      const now = new Date();
      const diffTime = now - postDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      jobDateEl.textContent = `Posted: ${diffDays} days ago`;

      jobInfoGroupEl.append(jobTitleEl, jobDetailEl, jobDateEl);

      const detailBtnEl = document.createElement('div');
      detailBtnEl.className = 'detail-btn';
      detailBtnEl.textContent = 'See details';
      card.append(jobInfoGroupEl, detailBtnEl);
      productsGrid.append(card);
    });

    // 更新结果计数，显示聚合后的产品卡数量
    try {
      const resultsEl = document.querySelector('.plp-results');
      if (resultsEl) {
        const visible = resultsEl.querySelector('.plp-results-count-visible');
        const hidden = resultsEl.querySelector('.plp-results-count');
        const count = allGroupedData.length;
        if (visible) {
          visible.textContent = String(count);
        }
        if (hidden) {
          hidden.textContent = String(count);
        }
        if (!visible && !hidden) {
          const currentText = resultsEl.textContent || '';
          const updatedText = currentText.replace(/\{[^}]*\}/, String(count));
          resultsEl.textContent = updatedText;
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }

    // 当结果为0时显示no result
    try {
      const noResultEl = document.querySelector('.job-cards-no-result');
      const cardWrapperEl = document.querySelector('.job-item-card-wrapper');
      if (noResultEl) {
        if (allGroupedData.length === 0) {
          noResultEl.style.display = 'flex';
          productsGrid.style.display = 'none';
          cardWrapperEl.style.cssText = 'margin: auto !important;';
        } else {
          noResultEl.style.display = 'none';
          productsGrid.style.display = 'flex';
          cardWrapperEl.style.cssText = '';
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }
  }

  // 包含多个相同 factoryModel 的不同尺寸
  const extractSize = (item) => {
    if (!item) return null;
    if (item.size) return String(item.size).replace(/["\s]/g, '');
    return null;
  };

  function renderItems(items) {
    // 重置分页状态
    currentPage = 1;
    productsGrid.innerHTML = ''; // 清空现有内容

    // 按 factoryModel 聚合
    const groups = {};
    items.forEach((it) => {
      const key = it.factoryModel || it.spu || it.overseasModel;
      if (!groups[key]) {
        groups[key] = {
          factoryModel: it.factoryModel || null,
          representative: it,
          variants: [],
          sizes: new Set(),
          colors: new Set(),
        };
      }
      groups[key].variants.push(it);
      // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
      if (window.useShortDescriptionAsImage) {
        if (!groups[key].representative.description_shortDescription
            && it.description_shortDescription) {
          groups[key].representative = it;
        }
      } else if (!groups[key].representative.mediaGallery_image && it.mediaGallery_image) {
        // 否则走默认逻辑
        groups[key].representative = it;
      }
      const sz = extractSize(it);
      if (sz) groups[key].sizes.add(sz);
      const color = it?.colorRGB;
      if (color) groups[key].colors.add(color);
    });

    allGroupedData = Object.keys(groups).map((k) => {
      const g = groups[k];
      const sizes = Array.from(g.sizes).filter(Boolean).sort((a, b) => Number(b) - Number(a));
      const colors = Array.from(g.colors).filter(Boolean);

      return {
        key: k,
        factoryModel: g.factoryModel,
        representative: g.representative,
        variants: g.variants,
        sizes,
        colors,
      };
    });

    productsGrid.setAttribute('data-group-length', allGroupedData.length);

    // 渲染第一页
    renderPagedItems();
    // 更新Load More显示状态
    updateLoadMoreVisibility();
  }

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

  fetch(getGraphQLUrl(graphqlUrl))
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
    // 转换新的标签结构为产品列表格式
      const items = transformTagStructureToProducts(data);
      // 缓存到全局，供过滤器使用
      window.productData = items;
      if (window.renderPlpProducts) {
        window.renderPlpProducts(items);
      } else {
        renderItems(items);
      }
      // 页面初始化查询用默认排序
      applyDefaultSort();
      // 检查URL参数并应用筛选
      applyUrlFilters();
      // 初始化询问比较固定栏
      fixedBottomCompareBar();
    })
    .catch(() => {});
  /* eslint-disable-next-line no-underscore-dangle */
  window.renderItems = renderItems;
}

// 是否使用 description_shortDescription 作为图片链接，默认使用
window.useShortDescriptionAsImage = false;

// 暴露渲染和筛选接口到window全局，供 filter/tags 使用（在 renderItems 定义后）
window.renderProductsInternal = function renderProductsInternalProxy(items) {
  if (typeof window.renderItems === 'function') {
    window.renderItems(items);
  }
};
window.lastRenderedProducts = null;
// 当前排序状态，用于筛选时判断是否需要默认选中最大尺寸
window.currentSortKey = '';

// 检查是否配置了默认排序
const checkAndApplyDefaultSort = () => {
  const selectedSortOption = document.querySelector('.plp-sort-option.selected');
  if (selectedSortOption) {
    const sortValue = selectedSortOption.dataset.value
        || selectedSortOption.getAttribute('data-value')
        || '';
    window.currentSortKey = sortValue.trim();
  }
};
// 确保 DOM 已加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndApplyDefaultSort);
} else {
  checkAndApplyDefaultSort();
}

window.renderPlpProducts = function renderPlpProductsWrapper(items) {
  window.lastRenderedProducts = Array.isArray(items) ? items.slice() : [];
  window.renderProductsInternal(items);
};

// 排序
// eslint-disable-next-line consistent-return
window.applyPlpSort = function applyPlpSort(sortKey) {
  try {
    const sortProperty = String(sortKey || '').trim();

    // 保存当前排序状态
    window.currentSortKey = sortProperty;

    let direction = -1; // 默认降序
    let effectiveSortProperty = sortProperty;
    if (effectiveSortProperty.startsWith('-')) {
      direction = 1; // 升序
      effectiveSortProperty = effectiveSortProperty.slice(1);
    }

    // 如果没有指定排序属性或者指size
    if (!effectiveSortProperty || effectiveSortProperty === 'size') {
      return applyAggregatedSort('size', direction);
    }

    // 其他属性也使用聚合后排序逻辑
    applyAggregatedSort(effectiveSortProperty, direction);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn(e);
  }
};

// 获取选中的 filter（checkbox 和 radio）
window.applyPlpFilters = function applyPlpFilters() {
  try {
    // 检查当前排序状态，如果是默认排序和 size，需要筛选后默认选中最大尺寸
    const currentSort = String(window.currentSortKey || '').trim();
    const effectiveSort = currentSort.startsWith('-') ? currentSort.slice(1) : currentSort;
    const isDefaultSort = (!effectiveSort || effectiveSort === 'size');
    window.isDefaultSortApplied = isDefaultSort;

    const allProducts = window.productData || [];

    // 收集所有被选中的 filter group，同组内为 OR，不同组为 AND
    const filterGroups = [...document.querySelectorAll('.plp-filter-group')];
    const selectedByGroup = filterGroups.map((group) => {
      // 同时收集 checkbox 和 radio 类型的选中项
      const checkboxes = [...group.querySelectorAll('input[type="checkbox"][data-option-value]:checked')];
      const radios = [...group.querySelectorAll('input[type="radio"][data-option-value]:checked')];

      const allInputs = [...checkboxes, ...radios];

      return allInputs
        .map((input) => {
          const value = input.getAttribute('data-option-value');
          // 对于 radio 类型，如果标签以 /no 结尾，忽略这个 filter
          if (input.type === 'radio' && value && value.toLowerCase().endsWith('/no')) {
            return null;
          }
          return value;
        })
        .filter((val) => val && val.length > 0);
    }).filter((arr) => arr && arr.length);

    // 执行过滤，要求产品必须要有 tags 属性
    const filtered = allProducts.filter((item) => {
      const tagsRaw = Array.isArray(item.tags) ? item.tags : [];
      const itemTags = tagsRaw.map((t) => String(t).toLowerCase());
      if (!itemTags.length) return false;

      return selectedByGroup.every((groupSelected) => groupSelected.some((selectedTag) => {
        const selectedLower = String(selectedTag).toLowerCase();
        // 完全匹配标签路径
        return itemTags.includes(selectedLower);
      }));
    });

    // 保存筛选结果，用于后续排序
    window.filteredProducts = filtered;

    // 如果有非默认排序，应用排序；否则直接渲染
    if (currentSort !== '' && !isDefaultSort && window.applyPlpSort) {
      // 非空且非默认排序 → 应用排序
      window.applyPlpSort(currentSort);
    } else if (currentSort === '' && window.filteredProducts && window.filteredProducts.length > 0) {
      // currentSort 为空字符串但有筛选结果时，使用默认排序（size 降序）
      applyAggregatedSort('size', -1);
    } else {
      // 无筛选或默认情况 → 直接渲染
      window.renderPlpProducts(filtered);
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    if (window.renderPlpProducts) window.renderPlpProducts(window.productData || []);
  }
};
