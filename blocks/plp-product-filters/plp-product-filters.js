import { moveInstrumentation } from '../../scripts/scripts.js';

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

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');

  if (isEditMode) {
    return;
  }

  const filtersBar = document.createElement('div');
  filtersBar.className = 'plp-filters-bar';

  const filtersLeft = document.createElement('div');
  filtersLeft.className = 'plp-filters-left';

  const rows = [...block.children];
  let resultsText = '{count} RESULT';
  let resetText = 'Reset filters';
  let sortBy = 'Price: Highest To Lowest';
  const filterTags = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim();
      const value = cells[1].textContent.trim();

      if (key === 'results') {
        resultsText = value || resultsText;
      } else if (key === 'reset') {
        resetText = value || resetText;
      } else if (key === 'sortBy') {
        sortBy = value || sortBy;
      } else if (key === 'title') {
        filterTags.push(buildFilterTag(row));
      }
    }
  });

  // 结果数量显示
  const resultsBox = document.createElement('div');
  resultsBox.className = 'plp-results-box';
  const results = document.createElement('div');
  results.className = 'plp-results';
  results.textContent = resultsText;
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

  filtersLeft.append(resultsBox, activeFilters, resetFilters);

  // 排序下拉框
  const sortBox = document.createElement('div');
  sortBox.className = 'plp-sort-box';
  const sort = document.createElement('div');
  sort.className = 'plp-sort';
  const sortSpan = document.createElement('span');
  sortSpan.textContent = 'SORT BY';
  const sortImg = document.createElement('img');
  sortImg.src = 'arrow.svg';
  sortImg.alt = 'Sort options';
  sort.append(sortSpan, sortImg);

  const sortOptions = document.createElement('div');
  sortOptions.className = 'plp-sort-options';
  const options = [
    'Size: Largest To Smallest',
    'Price: Highest To Lowest',
    'Newest',
  ];
  options.forEach((option) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'plp-sort-option';
    if (option === sortBy) {
      optionDiv.classList.add('selected');
    }
    optionDiv.textContent = option;
    optionDiv.setAttribute('role', 'button');
    optionDiv.setAttribute('tabindex', '0');
    sortOptions.append(optionDiv);
  });

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
      sortSpan.textContent = option.textContent;
      sortBox.classList.remove('show');
    });
  });

  // 点击关闭下拉框
  document.addEventListener('click', (e) => {
    if (!sortBox.contains(e.target)) {
      sortBox.classList.remove('show');
    }
  });

  filtersBar.append(filtersLeft, sortBox);
  block.replaceChildren(filtersBar);
}
