import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

const MOCK_NEWSROOM_ITEMS = [
  {
    path: '/us/en/company/newsroom/article-3',
    title: 'Hisense Accelerates ESG Strategy with AI-Driven Sustainability Milestones - 3',
    'published-date': '2026-02-09T06:55:15.717Z',
    description: '',
    thumbnail: '/content/dam/hisense/plp-product-filter-carousel/source-rgb-1.png',
    subtitle: 'PARTNERSHIP -3',
    date: '2026-02-05T00:00:00.000Z',
    location: 'QingDao -3',
  },
  {
    path: '/us/en/company/newsroom/article-4',
    title: 'Hisense Accelerates ESG Strategy with AI-Driven Sustainability Milestones - 4',
    'published-date': '2026-02-09T06:56:08.838Z',
    description: '',
    thumbnail: '/content/dam/hisense/plp-product-filter-carousel/source-micro-1.png',
    subtitle: 'PARTNERSHIP -4',
    date: '2026-02-05T00:00:00.000Z',
    location: 'QingDao',
  },
  {
    path: '/us/en/company/newsroom/article-2',
    title: 'Hisense Accelerates ESG Strategy with AI-Driven Sustainability Milestones - 2',
    'published-date': '2026-02-09T06:54:23.865Z',
    description: '',
    thumbnail: '/content/dam/hisense/us/products/televisions/a6-series/key-visual/a6.png',
    subtitle: 'PARTNERSHIP -2',
    date: '2026-02-05T00:00:00.000Z',
    location: 'QingDao -2',
  },
  {
    path: '/us/en/company/newsroom/article-body',
    title: 'Hisense Accelerates ESG Strategy with AI-Driven Sustainability Milestones',
    'published-date': '2026-02-09T06:29:23.342Z',
    description: '',
    thumbnail: '/content/dam/hisense/plp-product-filter-carousel/source-hi-qled.png',
    subtitle: 'PARTNERSHIP',
    date: '2026-02-05T00:00:00.000Z',
    location: 'QingDao',
  },
];

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

  return items.filter((item) => (
    filters.every(({ key, value }) => lowerIncludes(item[key], value))
  ));
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
    download,
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

  if (download) {
    const downloadEl = document.createElement('span');
    downloadEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/content/dam/hisense/us/common-icons/download.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    downloadEl.appendChild(iconImg);
    // 追加点击下载
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

function buildPaginationControls(container, state, onPageChange) {
  const { total, limit, offset } = state;

  const paginationEl = container.querySelector('.releases-pagination');
  if (!paginationEl) return;

  paginationEl.textContent = '';

  if (!total || !limit || total <= limit) {
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

async function fetchNewsroom(offset, limit) {
  const { pathname } = window.location;

  // /content 开头，使用本地 mock 数据，避免跨域请求失败
  if (pathname.startsWith('/content')) {
    const start = Number.isFinite(offset) ? offset : 0;
    const pageSize = Number.isFinite(limit) ? limit : MOCK_NEWSROOM_ITEMS.length;
    const sliced = MOCK_NEWSROOM_ITEMS.slice(start, start + pageSize);

    return {
      data: sliced,
      offset: start,
      limit: pageSize,
      total: MOCK_NEWSROOM_ITEMS.length,
    };
  }

  const segments = pathname.split('/').filter(Boolean);

  const country = segments[0] || 'us';
  let language;

  if (country.toLowerCase() === 'us') {
    language = 'en';
  } else {
    language = segments[1] || 'en';
  }

  const basePath = `/${country}/${language}/newsroom.json`;
  const url = basePath;

  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('Failed to load newsroom index', response.status);
    return null;
  }
  return response.json();
}

async function loadAllNewsroom(pageSize) {
  const size = Number.isFinite(pageSize) ? pageSize : MOCK_NEWSROOM_ITEMS.length;
  const json = await fetchNewsroom(0, size);
  if (!json) return [];
  return normalizeNewsroomData(json);
}

/**
 * News Card List Block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  const titleText = config.title || 'Recent Press Releases';
  const pageSize = Number.parseInt(config['page-size'], 10) || 9;
  const emptyText = config['empty-text'] || 'No news items match your filters.';

  const blockResource = block.getAttribute('data-aue-resource');

  // Build static structure
  const container = document.createElement('div');
  container.className = 'releases-container';

  const sectionTitleEl = document.createElement('div');
  sectionTitleEl.className = 'section-title';
  sectionTitleEl.textContent = titleText;

  container.appendChild(sectionTitleEl);

  const cardGroupEl = document.createElement('div');
  cardGroupEl.className = 'releases-card-group';
  container.appendChild(cardGroupEl);

  const paginationEl = document.createElement('div');
  paginationEl.className = 'releases-pagination';
  container.appendChild(paginationEl);

  // Ensure the editor can still find this block
  if (blockResource) {
    block.setAttribute('data-aue-resource', blockResource);
  }

  block.replaceChildren(container);

  const allItems = await loadAllNewsroom(pageSize);

  const loadPage = async (page) => {
    const filteredItems = filterItemsByUrlParams(allItems);
    const totalItems = filteredItems.length;

    cardGroupEl.textContent = '';
    paginationEl.textContent = '';

    if (!totalItems) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'releases-empty';
      emptyEl.innerHTML = emptyText;
      cardGroupEl.appendChild(emptyEl);
      return;
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = filteredItems.slice(startIndex, startIndex + pageSize);

    pageItems.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });

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
    });
  };

  await loadPage(1);

  block.classList.add('loaded');
}
