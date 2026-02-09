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

function normalizeNewsroomData(json) {
  if (!json || !Array.isArray(json.data)) return [];

  // Newer format: array of objects
  if (json.data.length > 0 && !Array.isArray(json.data[0])) {
    return json.data;
  }

  // Classic format: columns + rows
  const { columns } = json;
  if (!Array.isArray(columns)) return [];

  return json.data.map((row) => {
    const item = {};
    row.forEach((value, index) => {
      item[columns[index]] = value;
    });
    return item;
  });
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
    dateEl.textContent = formattedDate;
    metaGroupEl.appendChild(dateEl);
  }

  if (location) {
    const locationEl = document.createElement('span');
    locationEl.classList.add('meta-item');
    locationEl.textContent = location;
    metaGroupEl.appendChild(locationEl);
  }

  if (metaGroupEl.children.length > 0) {
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

    if (label === 'prev' || label === 'next') {
      const icon = document.createElement('img');
      icon.src = '/resources/news-pagination-arrow.svg';
      icon.alt = '';
      icon.classList.add('page-arrow');
      if (label === 'prev') {
        icon.classList.add('is-prev');
        btn.setAttribute('aria-label', 'Previous page');
      } else {
        icon.classList.add('is-next');
        btn.setAttribute('aria-label', 'Next page');
      }
      btn.appendChild(icon);
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
  const params = new URLSearchParams();
  if (typeof offset === 'number') params.set('offset', offset);
  if (typeof limit === 'number') params.set('limit', limit);

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
  const url = params.toString() ? `${basePath}?${params.toString()}` : basePath;

  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('Failed to load newsroom index', response.status);
    return null;
  }
  return response.json();
}

/**
 * News Card List Block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  const titleText = config.title || 'Recent Press Releases';
  const pageSize = Number.parseInt(config['page-size'], 10) || 9;

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

  let currentOffset = 0;

  const loadPage = async (page) => {
    const nextOffset = (page - 1) * pageSize;
    const json = await fetchNewsroom(nextOffset, pageSize);
    if (!json) return;

    const items = normalizeNewsroomData(json);

    cardGroupEl.textContent = '';
    items.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });

    currentOffset = json.offset ?? nextOffset;
    const state = {
      total: json.total ?? items.length,
      limit: json.limit ?? pageSize,
      offset: currentOffset,
    };

    buildPaginationControls(container, state, (targetPage) => {
      if (targetPage < 1) return;
      const totalPages = Math.ceil(state.total / state.limit);
      if (targetPage > totalPages) return;
      loadPage(targetPage);
    });
  };

  await loadPage(1);

  block.classList.add('loaded');
}
