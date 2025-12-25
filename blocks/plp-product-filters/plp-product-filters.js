import { moveInstrumentation } from '../../scripts/scripts.js';

function buildFilterTag(row, resource, isEditMode) {
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
  if (isEditMode && resource) {
    tag.setAttribute('data-aue-resource', resource);
  }
  return tag;
}

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');

  const filtersBar = document.createElement('div');
  filtersBar.className = 'plp-filters-bar';

  const filtersLeft = document.createElement('div');
  filtersLeft.className = 'plp-filters-left';

  const rows = [...block.children];
  let resultsText = '';
  let resetText = '';
  let sortBy = '';
  const filterTags = [];
  const sortOptionsList = [];
  let currentContext = null;

  let resourceResults = null;
  let resourceReset = null;
  let resourceSortBy = null;
  let resourceTitle = null;

  rows.forEach((row) => {
    const resource = row.getAttribute('data-aue-resource') || null;
    const cells = [...row.children];
    if (cells.length >= 2) {
      const left = cells[0].textContent.trim();
      const right = cells[1].textContent.trim();

      if (left === 'results') {
        resultsText = right;
        currentContext = 'results';
        resourceResults = resource;
      } else if (left === 'reset') {
        resetText = right;
        currentContext = 'reset';
        resourceReset = resource;
      } else if (left === 'sortBy') {
        sortBy = right;
        currentContext = 'sortBy';
        resourceSortBy = resource;
      } else if (left === 'title') {
        filterTags.push(buildFilterTag(row, resource, isEditMode));
        currentContext = 'title';
        resourceTitle = resource;
      } else if (currentContext === 'sortBy') {
        sortOptionsList.push({ label: left, value: right, resource });
      }
    }
  });

  // 结果数量显示
  const resultsBox = document.createElement('div');
  resultsBox.className = 'plp-results-box';
  if (isEditMode && resourceResults) {
    resultsBox.setAttribute('data-aue-resource', resourceResults);
  }
  const results = document.createElement('div');
  results.className = 'plp-results';
  // 保留一个隐藏的占位符 span，用于后续更新数量
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
  if (isEditMode && resourceTitle) {
    activeFilters.setAttribute('data-aue-resource', resourceTitle);
  }
  filterTags.forEach((tag) => {
    activeFilters.append(tag);
  });

  // 重置按钮
  const resetFilters = document.createElement('div');
  resetFilters.className = 'plp-reset-filters';
  resetFilters.textContent = resetText;
  resetFilters.setAttribute('role', 'button');
  resetFilters.setAttribute('tabindex', '0');
  if (isEditMode && resourceReset) {
    resetFilters.setAttribute('data-aue-resource', resourceReset);
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
  });

  filtersLeft.append(resultsBox, activeFilters, resetFilters);

  // 排序下拉框
  const sortBox = document.createElement('div');
  sortBox.className = 'plp-sort-box';
  if (isEditMode && resourceSortBy) {
    sortBox.setAttribute('data-aue-resource', resourceSortBy);
  }
  const sort = document.createElement('div');
  sort.className = 'plp-sort';
  const sortSpan = document.createElement('span');
  // label comes from configuration (sortBy)
  sortSpan.textContent = sortBy;
  const sortImg = document.createElement('img');
  sortImg.src = './media_18b1fbb6305019af784f87587d3bfbc78f2ca3575.svg?width=750&format=svg&optimize=medium';
  sortImg.alt = 'Sort options';
  sort.append(sortSpan, sortImg);

  const sortOptions = document.createElement('div');
  sortOptions.className = 'plp-sort-options';
  const options = sortOptionsList;
  if (options && options.length) {
    options.forEach((option) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'plp-sort-option';
      const label = option.label || option;
      if (label === sortBy) {
        optionDiv.classList.add('selected');
      }
      optionDiv.textContent = label;
      if (option.value) optionDiv.dataset.value = option.value;
      if (isEditMode && option.resource) {
        optionDiv.setAttribute('data-aue-resource', option.resource);
      }
      optionDiv.setAttribute('role', 'button');
      optionDiv.setAttribute('tabindex', '0');
      sortOptions.append(optionDiv);
    });
  }

  sortBox.append(sort, sortOptions);

  // 切换排序下拉框
  sort.addEventListener('click', () => {
    sortBox.classList.toggle('show');
  });

  // 选择排序
  sortOptions.querySelectorAll('.plp-sort-option').forEach((option) => {
    option.addEventListener('click', () => {
      sortOptions.querySelectorAll('.plp-sort-option').forEach((opt) => {
        opt.classList.remove('selected');
      });
      option.classList.add('selected');
      // "sort by <option>"
      const prefix = (typeof sortBy === 'string' && sortBy.trim()) ? sortBy.toLowerCase() : 'sort by';
      sortSpan.textContent = `${prefix} ${option.textContent}`;
      sortBox.classList.remove('show');
      try {
        const sortKey = option.dataset && option.dataset.value ? option.dataset.value : (option.getAttribute && option.getAttribute('data-value'));
        if (sortKey && window && typeof window.applyPlpSort === 'function') {
          window.applyPlpSort(sortKey);
        }
      } catch (e) {
        /* eslint-disable-next-line no-console */
        console.warn(e);
      }
    });
  });

  // 点击关闭下拉框
  document.addEventListener('click', (e) => {
    if (!sortBox.contains(e.target)) {
      sortBox.classList.remove('show');
    }
  });

  filtersBar.append(filtersLeft, sortBox);

  if (isEditMode) {
    const existingElements = [...block.children];
    const aueElements = existingElements.filter((el) => el.hasAttribute('data-aue-resource'));

    aueElements.forEach((el) => {
      el.style.display = 'none';
      filtersBar.append(el);
    });
  }

  block.replaceChildren(filtersBar);
}
