import { isMobileWindow } from '../../scripts/device.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  collectProductSortingAueAttributes,
  splitProductSortingAueAttributes,
} from './product-sorting-utils.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
function mergeProductSortingAueAttributes(...elements) {
  return elements.reduce((attributes, element) => ({
    ...attributes,
    ...collectProductSortingAueAttributes(element),
  }), {});
}

function applyProductSortingAueAttributes(target, attributes = {}) {
  Object.entries(attributes).forEach(([name, value]) => {
    target.setAttribute(name, value);
  });
}

function buildFilterTag(row) {
  const tag = document.createElement('div');
  tag.className = 'plp-filter-tag';
  moveInstrumentation(row, tag);

  const cells = [...row.children];
  const titleCell = cells.find((cell) => cell.textContent.trim()) || cells[0];

  const span = document.createElement('span');
  if (titleCell) {
    const text = titleCell.textContent.trim();
    if (text) {
      span.textContent = text;
    }
    moveInstrumentation(titleCell, span);
  }

  const closeBtn = document.createElement('span');
  closeBtn.className = 'plp-filter-tag-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Remove filter');

  tag.append(span, closeBtn);
  return tag;
}

function closeMobileSortByDom() {
  const sortBoxEl = document.querySelector('.plp-sort-box');
  sortBoxEl.classList.remove('mobile-sort-by-box');
  document.body.style.overflow = 'auto';
  const sortMask = document.querySelector('.mobile-sort-by-mask');
  sortMask.style.display = 'none';
}

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');

  const filtersBar = document.createElement('div');
  filtersBar.className = 'plp-filters-bar';

  const mobileFilterBar = document.createElement('div');
  mobileFilterBar.className = 'mobile-plp-filters-bar';

  const mobileSortMask = document.createElement('div');
  mobileSortMask.className = 'mobile-sort-by-mask';

  const filtersLeft = document.createElement('div');
  filtersLeft.className = 'plp-filters-left';

  const rows = [...block.children];
  let resultsText = '';
  let resetText = '';
  let sortBy = '';
  const filterTags = [];
  const sortOptionsList = [];
  let currentContext = null;

  let resultsInstrumentation = {};
  let resetInstrumentation = {};
  let sortByInstrumentation = {};

  rows.forEach((row) => {
    const resource = row.getAttribute('data-aue-resource') || null;
    const cells = [...row.children];
    if (cells.length >= 2) {
      const left = cells[0].textContent.trim();
      const right = cells[1].textContent.trim();

      if (left === 'results') {
        resultsText = right;
        currentContext = 'results';
        resultsInstrumentation = splitProductSortingAueAttributes(
          mergeProductSortingAueAttributes(row, cells[1]),
        ).attributes;
      } else if (left === 'reset') {
        resetText = right;
        currentContext = 'reset';
        resetInstrumentation = splitProductSortingAueAttributes(
          mergeProductSortingAueAttributes(row, cells[1]),
        ).attributes;
      } else if (left === 'sortBy') {
        sortBy = right;
        currentContext = 'sortBy';
        sortByInstrumentation = splitProductSortingAueAttributes(
          mergeProductSortingAueAttributes(row, cells[1]),
        ).attributes;
      } else if (left === 'title') {
        filterTags.push(buildFilterTag(row));
        currentContext = 'title';
      } else if (left === 'type') {
        filtersBar.setAttribute('data-type', right);
      } else if (currentContext === 'sortBy') {
        const optionAuthoring = splitProductSortingAueAttributes(
          collectProductSortingAueAttributes(row),
          { transferResource: true },
        );
        const option = {
          label: left, value: right, resource: optionAuthoring.resource || resource, isDefaultSearch: false,
        };

        if (cells.length >= 3) {
          const isDefaultText = cells[2].textContent.trim();
          option.isDefaultSearch = isDefaultText === 'true';
        }

        option.dataAueAttributes = optionAuthoring.attributes;
        sortOptionsList.push(option);
      } else {
        const optionAuthoring = splitProductSortingAueAttributes(
          collectProductSortingAueAttributes(row),
          { transferResource: true },
        );
        const option = {
          label: 'No data',
          value: 'No data',
          resource: optionAuthoring.resource || resource,
        };
        option.dataAueAttributes = optionAuthoring.attributes;
        sortOptionsList.push(option);
      }
    }
  });

  // 结果数量显示
  const resultsBox = document.createElement('div');
  resultsBox.className = 'plp-results-box';
  const results = document.createElement('div');
  results.className = 'plp-results';
  if (isEditMode) {
    applyProductSortingAueAttributes(results, resultsInstrumentation);
  }
  // 保留一个隐藏的占位 span，用于后续更新数字
  const placeholderMatch = resultsText.match(/\{[^}]*\}/);
  if (placeholderMatch) {
    const parts = resultsText.split(placeholderMatch[0]);
    if (parts[0]) results.append(document.createTextNode(parts[0]));
    const visibleCount = document.createElement('span');
    visibleCount.className = 'plp-results-count-visible';
    visibleCount.textContent = ''; // 会在产品加载时填充
    results.append(visibleCount);
    if (parts[1]) results.append(document.createTextNode(parts[1]));
    const hiddenSpan = document.createElement('span');
    hiddenSpan.className = 'plp-results-count';
    hiddenSpan.style.display = 'none';
    const [match] = placeholderMatch;
    hiddenSpan.textContent = match;
    results.append(hiddenSpan);
  } else {
    results.textContent = resultsText;
    const hiddenSpan = document.createElement('span');
    hiddenSpan.className = 'plp-results-count';
    hiddenSpan.style.display = 'none';
    hiddenSpan.textContent = '';
    results.append(hiddenSpan);
  }
  resultsBox.append(results);

  // 筛选标签容器
  const activeFilters = document.createElement('div');
  activeFilters.className = 'plp-active-filters';
  filterTags.forEach((tag) => {
    activeFilters.append(tag);
  });

  // 重置按钮
  const resetFilters = document.createElement('div');
  resetFilters.className = 'plp-reset-filters';
  resetFilters.textContent = resetText;
  resetFilters.setAttribute('role', 'button');
  resetFilters.setAttribute('tabindex', '0');
  if (isEditMode) {
    applyProductSortingAueAttributes(resetFilters, resetInstrumentation);
  }
  resetFilters.addEventListener('click', () => {
    const activeContainer = document.querySelector('.plp-active-filters');
    if (activeContainer) {
      activeContainer.querySelectorAll('.plp-filter-tag').forEach((tag) => tag.remove());
    }
    document.querySelectorAll('input[type="checkbox"][data-option-value]').forEach((cb) => {
      if (cb.checked) {
        cb.checked = false;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    // 处理 radio 的情况，取消选中当前选中的 radio
    document.querySelectorAll('input[type="radio"][data-option-value]').forEach((radio) => {
      if (radio.checked) {
        radio.checked = false;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    // 勾选回 value 以 /no 结尾的 radio
    const connectLifeNoRadio = document.querySelector('input[type="radio"][data-option-value$="/no"]');
    if (connectLifeNoRadio) {
      connectLifeNoRadio.checked = true;
    }
  });

  filtersLeft.append(resultsBox, activeFilters, resetFilters);

  // 移动端filters 标题
  const mobileFilters = document.createElement('div');
  mobileFilters.className = 'plp-mobile-filters';
  const mobileFilterTit = document.createElement('div');
  mobileFilterTit.className = 'mobile-filter-title';
  const mobileFiltersSpan = document.createElement('span');
  mobileFiltersSpan.textContent = 'FILTERS';
  const mobileFiltersImg = document.createElement('img');
  mobileFiltersImg.src = `/content/dam/hisense/${country}/common-icons/mobile-filters-title.svg`;
  mobileFiltersImg.alt = 'Filters title';
  mobileFilterTit.append(mobileFiltersImg, mobileFiltersSpan);
  mobileFilters.append(mobileFilterTit);
  const filterDetailEl = document.querySelector('.product-filter-wrapper');

  // mobile 端，Filters 点击事件，显示 filter 数据
  mobileFilters.addEventListener('click', () => {
    document.body.style.overflow = 'hidden';
    filterDetailEl.classList.toggle('mobile-filter-show');
  });

  // 排序下拉
  const sortBox = document.createElement('div');
  sortBox.className = 'plp-sort-box';
  if (isEditMode) {
    sortBox.className = 'plp-sort-box show';
  }
  const sort = document.createElement('div');
  sort.className = 'plp-sort';
  if (isEditMode) {
    applyProductSortingAueAttributes(sort, sortByInstrumentation);
  }
  const sortSpan = document.createElement('span');
  // label comes from configuration (sortBy)
  sortSpan.textContent = sortBy;
  const sortImg = document.createElement('img');
  sortImg.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
  sortImg.alt = 'Sort options';
  sortImg.className = 'sort-arrow';
  // 移动端 sort by close btn
  const closeImg = document.createElement('img');
  closeImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
  closeImg.alt = 'mobile-close-sort-by';
  closeImg.className = 'mobile-sort-by-close';
  // 移动端 sort by close 点击事件
  closeImg.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    closeMobileSortByDom();
  });
  sort.append(sortSpan, sortImg, closeImg);

  // 移动端 sort by
  const mobileSort = document.createElement('div');
  mobileSort.className = 'mobile-plp-sort';
  const mobileSortSpan = document.createElement('span');
  // label comes from configuration (sortBy)
  mobileSortSpan.textContent = sortBy;
  const mobileSortImg = document.createElement('img');
  mobileSortImg.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
  mobileSortImg.alt = 'Sort options';
  mobileSort.append(mobileSortSpan, mobileSortImg);

  // mobile 端，Sort by 点击事件，显示sort options数据
  mobileSort.addEventListener('click', () => {
    document.body.style.overflow = 'hidden';
    const originalSortByBoxEl = document.querySelector('.plp-sort-box');
    originalSortByBoxEl.classList.add('mobile-sort-by-box');
    const sortMask = document.querySelector('.mobile-sort-by-mask');
    sortMask.style.display = 'block';
  });
  // 为 mobileFilters, mobileSort 创建独立类名为 mobile-plp-filters-bar 的 div 元素
  mobileFilterBar.append(mobileFilters, mobileSort);

  const sortOptions = document.createElement('div');
  sortOptions.className = 'plp-sort-options';

  // 检查是否有默认排序选项
  const hasDefaultSearchOption = sortOptionsList.some((option) => option.isDefaultSearch);

  // 如果没有默认排序选项，添加默认的Default选项
  let options;
  if (hasDefaultSearchOption) {
    options = [...sortOptionsList];
  } else {
    const defaultOption = {
      label: 'Default', value: '', resource: null, dataAueAttributes: {},
    };
    options = [defaultOption, ...sortOptionsList];
  }
  if (options && options.length) {
    let hasSelectedOption = false;

    // 首先检查是否有默认排序选项，有就先选中
    const defaultSearchOption = options.find((option) => option.isDefaultSearch);
    let optionToSelect = null;

    if (defaultSearchOption) {
      optionToSelect = defaultSearchOption;
    } else {
      // 如果没有默认排序选项，就按原有Default逻辑选择
      optionToSelect = options.find((option) => {
        const label = option.label || option;
        return label === sortBy;
      }) || options[0];
    }

    options.forEach((option) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'plp-sort-option';
      const label = option.label || option;

      if (option === optionToSelect && !hasSelectedOption) {
        optionDiv.classList.add('selected');
        hasSelectedOption = true;
      }
      optionDiv.textContent = label;
      if (option.value !== undefined && option.value !== null) {
        optionDiv.dataset.value = option.value;
      }
      if (isEditMode && option.resource) {
        optionDiv.setAttribute('data-aue-resource', option.resource);
      }

      // 设置所有以 data-aue 开头的属性
      if (isEditMode && option.dataAueAttributes) {
        Object.keys(option.dataAueAttributes).forEach((attrName) => {
          optionDiv.setAttribute(attrName, option.dataAueAttributes[attrName]);
        });
      }
      if (option.isDefaultSearch) {
        optionDiv.setAttribute('data-is-default-search', 'true');
      }

      optionDiv.setAttribute('role', 'button');
      optionDiv.setAttribute('tabindex', '0');
      sortOptions.append(optionDiv);
    });

    // 更新默认选中选项的文本显示
    const selectedOption = sortOptions.querySelector('.plp-sort-option.selected');
    if (selectedOption) {
      const prefix = (typeof sortBy === 'string' && sortBy.trim()) ? sortBy : 'Sort By';
      sortSpan.textContent = `${prefix} ${selectedOption.textContent}`;
      mobileSortSpan.textContent = `${prefix} ${selectedOption.textContent}`;
      // 触发默认排序逻辑
      try {
        if (window && typeof window.applyPlpSort === 'function') {
          const initKey = (selectedOption.dataset && Object.prototype.hasOwnProperty.call(selectedOption.dataset, 'value'))
            ? selectedOption.dataset.value
            : (selectedOption.getAttribute && selectedOption.getAttribute('data-value'));
          // 触发默认排序逻辑
          window.applyPlpSort(initKey == null ? '' : initKey);
        }
      } catch (e) {
        /* eslint-disable-next-line no-console */
        console.warn(e);
      }
    }
  }

  sortBox.append(sort, sortOptions);

  // 切换排序下拉
  sort.addEventListener('click', (e) => {
    // sortBox.classList.toggle('show');
    // 为排序移动端添加样式
    if (isMobileWindow()) {
      e.preventDefault();
    } else {
      sortBox.classList.toggle('show');
    }
  });

  // 选择排序
  sortOptions.querySelectorAll('.plp-sort-option').forEach((option) => {
    option.addEventListener('click', () => {
      // 如果点击的排序 option 已经是选中的 option，不做任何操作
      if (option.classList.contains('selected')) {
        sortBox.classList.remove('show');
        return;
      }

      sortOptions.querySelectorAll('.plp-sort-option').forEach((opt) => {
        opt.classList.remove('selected');
      });
      option.classList.add('selected');

      // "sort by <option>"
      const prefix = (typeof sortBy === 'string' && sortBy.trim()) ? sortBy : 'Sort By';
      const splitText = option.textContent.split(':')[0].trim();
      sortSpan.textContent = `${prefix} ${splitText}`;
      mobileSortSpan.textContent = `${prefix} ${splitText}`;
      sortBox.classList.remove('show');
      // 如果是移动端，点击sort by 选项要关闭全屏筛选内容，返回列表页面
      if (isMobileWindow()) {
        closeMobileSortByDom();
      }
      try {
        const sortKey = (option.dataset && Object.prototype.hasOwnProperty.call(option.dataset, 'value'))
          ? option.dataset.value
          : (option.getAttribute && option.getAttribute('data-value'));
        try {
          if (window && typeof window.applyPlpSort === 'function') {
            // 如果 sortKey 是 undefined/null，则传空字符串以触发默认排序
            window.applyPlpSort(sortKey == null ? '' : sortKey);
          }
        } catch (e) {
          /* eslint-disable-next-line no-console */
          console.warn(e);
        }
      } catch (e) {
        /* eslint-disable-next-line no-console */
        console.warn(e);
      }
    });
  });

  // 点击关闭下拉
  document.addEventListener('click', (e) => {
    if (!sortBox.contains(e.target)) {
      sortBox.classList.remove('show');
    }
  });

  filtersBar.append(filtersLeft, sortBox, mobileFilterBar, mobileSortMask);
  block.replaceChildren(filtersBar);
}
