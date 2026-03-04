import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

function getSearchFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search || '');
  const filters = [];

  params.forEach((value, key) => {
    if (!value) return;
    // 跳过分页相关参数和 ref 等非搜索参数
    if (key === 'offset' || key === 'limit' || key === 'ref') return;
    filters.push({ key, value });
  });

  return filters;
}

function filterItemsByUrlParams(items) {
  const filters = getSearchFiltersFromUrl();
  if (!filters.length) return items;

  const lowerIncludes = (source, query) => {
    if (source == null) return false;
    const s = String(source).toLowerCase();
    const q = String(query).toLowerCase();
    return s.includes(q);
  };

  return items.filter((item) => filters.every(({ key, value }) => {
    // fulltext 参数：搜索所有字段
    if (key === 'fulltext') {
      const searchableFields = [
        item.title,
        item.subtitle,
        item.location,
        item.description,
        item.keywords,
        item.path,
      ];
      // 如果 value 包含 "-"，同时匹配原值和空格替换
      if (value.includes('-')) {
        const originalValue = value;
        const spaceValue = value.replace(/-/g, ' ');
        return searchableFields.some((field) => lowerIncludes(field, originalValue)
          || lowerIncludes(field, spaceValue));
      }
      return searchableFields.some((field) => lowerIncludes(field, value));
    }
    // 其他参数：精确匹配对应字段
    return lowerIncludes(item[key], value);
  }));
}

function getItemDateValue(item) {
  const value = item.date || item['published-date'];
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function normalizeNewsroomData(json) {
  if (!json || !Array.isArray(json.data)) return [];

  if (json.data.length > 0 && !Array.isArray(json.data[0])) {
    const items = [...json.data];
    items.sort((a, b) => getItemDateValue(b) - getItemDateValue(a));
    return items;
  }

  // Classic format: columns + rows
  const { columns } = json;
  if (!Array.isArray(columns)) return [];

  const items = json.data.map((row) => {
    const item = {};
    row.forEach((value, index) => {
      item[columns[index]] = value;
    });
    return item;
  });
  items.sort((a, b) => getItemDateValue(b) - getItemDateValue(a));
  return items;
}

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildCard(item) {
  const {
    path,
    title,
    subtitle,
    date,
    location,
    downloadlink,
    thumbnail,
  } = item;

  const cardEl = document.createElement('div');
  cardEl.classList.add('releases-card');

  const linkHref = typeof path === 'string' ? path : '#';

  // Image
  if (thumbnail) {
    const imageWrapper = document.createElement('a');
    imageWrapper.href = linkHref;
    imageWrapper.classList.add('releases-image');

    const picture = createOptimizedPicture(
      thumbnail,
      title || '',
      false,
      [{ width: '750' }],
    );

    imageWrapper.appendChild(picture);
    cardEl.appendChild(imageWrapper);
  }

  // Content
  const contentEl = document.createElement('div');
  contentEl.classList.add('releases-content');

  // Eyebrow (use subtitle as category)
  if (subtitle) {
    const eyebrowEl = document.createElement('span');
    eyebrowEl.classList.add('releases-eyebrow');
    eyebrowEl.textContent = subtitle;
    contentEl.appendChild(eyebrowEl);
  }

  // Title
  if (title) {
    const titleLink = document.createElement('a');
    titleLink.href = linkHref;
    titleLink.classList.add('releases-subtitle');
    titleLink.textContent = title;
    contentEl.appendChild(titleLink);
  }

  // author
  const authorEl = document.createElement('div');
  authorEl.classList.add('author');
  contentEl.append(authorEl);

  // Meta group
  const metaGroupEl = document.createElement('div');
  metaGroupEl.classList.add('releases-meta-group');

  const formattedDate = formatDate(date);
  if (formattedDate) {
    const dateEl = document.createElement('span');
    dateEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/clock-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    dateEl.appendChild(iconImg);
    dateEl.appendChild(document.createTextNode(formattedDate));
    metaGroupEl.appendChild(dateEl);
  }

  if (location) {
    const locationEl = document.createElement('span');
    locationEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/location-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    locationEl.appendChild(iconImg);
    locationEl.appendChild(document.createTextNode(location));
    metaGroupEl.appendChild(locationEl);
  }

  if (downloadlink) {
    const downloadEl = document.createElement('a');
    downloadEl.href = downloadlink;
    downloadEl.target = '_blank';
    downloadEl.classList.add('meta-item');
    downloadEl.classList.add('meta-download');
    const iconImg = document.createElement('img');
    iconImg.src = '/content/dam/hisense/us/common-icons/download.svg';
    iconImg.alt = 'Download';
    iconImg.classList.add('meta-icon');
    downloadEl.appendChild(iconImg);
    metaGroupEl.appendChild(downloadEl);
  }

  if (metaGroupEl.children.length > 0) {
    if (metaGroupEl.children.length > 1) {
      const itemElements = metaGroupEl.children;
      for (let i = itemElements.length - 2; i >= 0; i -= 1) {
        const lineEl = document.createElement('div');
        lineEl.className = 'line';
        itemElements[i].after(lineEl);
      }
    }
    contentEl.appendChild(metaGroupEl);
  }

  cardEl.appendChild(contentEl);

  return cardEl;
}

function buildPaginationControls(container, state, onPageChange, isEditMode) {
  const { total, limit, offset } = state;

  const paginationEl = container.querySelector('.releases-pagination');
  if (!paginationEl) return;

  paginationEl.textContent = '';

  if (!total || !limit || (total <= limit && !isEditMode)) {
    return;
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

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
      btn.setAttribute('aria-label', 'Previous page');
      btn.append(icon, disabledIcon);
    } else if (label === 'next') {
      const icon = document.createElement('img');
      icon.src = '/content/dam/hisense/us/common-icons/right.svg';
      icon.className = 'page-arrow is-next normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = '/content/dam/hisense/us/common-icons/right-disabled.svg';
      disabledIcon.className = 'page-arrow is-next disabled';
      btn.setAttribute('aria-label', 'Next page');
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

  // const maxButtons = 5;
  // let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  // let end = start + maxButtons - 1;
  // if (end > totalPages) {
  //   end = totalPages;
  //   start = Math.max(1, end - maxButtons + 1);
  // }

  // for (let page = start; page <= end; page += 1) {
  //   paginationEl.appendChild(
  //     createButton(String(page), page, false, page === currentPage),
  //   );
  // }

  const getVisiblePages = () => {
    const pages = [];

    if (totalPages <= 7) {
      // 总页数少，直接显示所有页
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      // 当前页在前部
      for (let i = 1; i <= 5; i += 1) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // 当前页在后部
      pages.push(1);
      pages.push('ellipsis');
      for (let i = totalPages - 4; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      // 当前页在中部
      pages.push(1);
      pages.push('ellipsis');
      for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();
  visiblePages.forEach((page) => {
    if (page === 'ellipsis') {
      const ellipsis = document.createElement('div');
      ellipsis.className = 'pagination-ellipsis';
      const circle = document.createElement('div');
      circle.className = 'pagination-ellipsis-circle';
      ellipsis.append(circle, circle.cloneNode(), circle.cloneNode());
      paginationEl.appendChild(ellipsis);
    } else {
      paginationEl.appendChild(
        createButton(String(page), page, false, page === currentPage),
      );
    }
  });

  // Next
  paginationEl.appendChild(
    createButton('next', currentPage + 1, currentPage === totalPages),
  );
}

async function fetchNewsroom(offset, limit, dataSource) {
  const { pathname } = window.location;

  const segments = pathname.split('/').filter(Boolean);

  const isContentPath = segments[0] === 'content';
  const countryIndex = isContentPath ? 2 : 0;
  const languageIndex = isContentPath ? 3 : 1;

  const country = segments[countryIndex] || 'us';
  let language;

  if (country.toLowerCase() === 'us') {
    language = 'en';
  } else {
    language = segments[languageIndex] || 'en';
  }

  const baseUrl = window.EDS_BASE_URL || window.location.origin;
  const basePath = `${baseUrl}/${country}/${language}/newsroom.json`;
  const url = dataSource || basePath;

  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('Failed to load newsroom index', response.status);
    return null;
  }
  return response.json();
}

async function loadAllNewsroom(pageSize, dataSource) {
  const size = Number.isFinite(pageSize) ? pageSize : dataSource.length;
  const json = await fetchNewsroom(0, size, dataSource);
  if (!json) return [];
  return normalizeNewsroomData(json);
}

/**
 * News Card List Block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const isEditMode = block.hasAttribute('data-aue-resource');

  const titleText = config.title || 'Recent Press Releases';
  const pageSize = Number.parseInt(config['page-size'], 10) || 9;
  // const emptyText = config['empty-text'] || 'No news items match your filters.';
  const shouldPaginated = true;
  const paginatedBtnText = config['paginated-btn-text'] || '';
  const discoverMoreText = config['discover-more-text'] || 'Discover more';
  const dataSource = config['data-source'] || '';

  const blockResource = block.getAttribute('data-aue-resource');

  // Build static structure
  const container = document.createElement('div');
  container.className = 'releases-container';

  const sectionTitleEl = document.createElement('div');
  sectionTitleEl.className = 'section-title';

  const isSearchPage = window.location.pathname.includes('search');
  // 标准的title逻辑
  const titleSpanEl = document.createElement('span');
  titleSpanEl.textContent = titleText;

  // result 逻辑
  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const fulltextValue = url.searchParams.get('fulltext');
  const resultTitleEl = document.createElement('div');
  resultTitleEl.className = 'section-result-title';
  const r = fulltextValue;
  const n = 'NO';
  resultTitleEl.innerHTML = `<div class="result-title"><span class="search-value">${r}</span> Results</div><div class="result-num"><span>${n}</span> RESULTS</div>`;
  if (isSearchPage) {
    sectionTitleEl.appendChild(resultTitleEl);
  } else {
    sectionTitleEl.appendChild(titleSpanEl);
  }

  container.appendChild(sectionTitleEl);

  const cardGroupEl = document.createElement('div');
  cardGroupEl.className = 'releases-card-group';
  container.appendChild(cardGroupEl);

  const paginationEl = document.createElement('div');
  paginationEl.className = 'releases-pagination';

  const mobilePaginationEl = document.createElement('div');
  mobilePaginationEl.className = 'releases-pagination-mobile';
  const mobileBtn = document.createElement('button');
  mobileBtn.type = 'button';
  mobileBtn.classList.add('page-button');
  mobileBtn.textContent = discoverMoreText;
  let mobileCurrentPage = 1;
  let mobileAbortCtrl = null;
  mobilePaginationEl.appendChild(mobileBtn);

  const noPaginationEl = document.createElement('div');
  noPaginationEl.className = 'releases-no-pagination';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.classList.add('page-button');
  btn.textContent = paginatedBtnText;
  noPaginationEl.appendChild(btn);
  if (shouldPaginated === 'false') {
    container.appendChild(noPaginationEl);
  } else {
    container.append(paginationEl, mobilePaginationEl);
  }

  // Ensure the editor can still find this block
  if (blockResource) {
    block.setAttribute('data-aue-resource', blockResource);
  }

  block.replaceChildren(container);

  const allItems = await loadAllNewsroom(pageSize, dataSource);

  const loadPage = async (page) => {
    const filteredItems = filterItemsByUrlParams(allItems);
    const totalItems = filteredItems.length;

    cardGroupEl.textContent = '';
    paginationEl.textContent = '';
    mobileCurrentPage = 1;

    if (!totalItems) {
      mobilePaginationEl.style.display = 'none';
      return;
    }

    try {
      document.querySelector('.section-title .result-num span').textContent = totalItems;
    } catch (e) {
      // something went awry
    }
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = filteredItems.slice(startIndex, startIndex + pageSize);

    pageItems.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });

    // Mobile: show/hide "discover more" based on remaining items
    const mobileShown = pageSize;
    const mobileTotalPages = Math.ceil(totalItems / pageSize);
    mobileCurrentPage = 1;
    mobilePaginationEl.style.display = (mobileShown >= totalItems) ? 'none' : '';

    const state = {
      total: totalItems,
      limit: pageSize,
      offset: startIndex,
    };

    buildPaginationControls(container, state, (targetPage) => {
      if (targetPage < 1) return;
      const maxPage = Math.ceil(state.total / state.limit);
      if (targetPage > maxPage) return;
      loadPage(targetPage);
    }, isEditMode);

    // Mobile "load more": append next page items without clearing previous
    if (mobileAbortCtrl) mobileAbortCtrl.abort();
    mobileAbortCtrl = new AbortController();

    mobileBtn.addEventListener('click', () => {
      mobileCurrentPage += 1;
      if (mobileCurrentPage > mobileTotalPages) return;

      const mobileStart = (mobileCurrentPage - 1) * pageSize;
      const mobileItems = filteredItems.slice(mobileStart, mobileStart + pageSize);
      mobileItems.forEach((item) => {
        const card = buildCard(item);
        cardGroupEl.appendChild(card);
      });

      if (mobileCurrentPage >= mobileTotalPages) {
        mobilePaginationEl.style.display = 'none';
      }
    }, { signal: mobileAbortCtrl.signal });
  };

  await loadPage(1);

  block.classList.add('loaded');
}
