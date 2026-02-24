import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

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

function normalizeNewsroomData(json) {
  if (!json || !Array.isArray(json.data)) return [];

  if (json.data.length > 0 && !Array.isArray(json.data[0])) {
    const items = [...json.data];
    return items.sort((a, b) => {
      const dateA = new Date(a.date || a['published-date'] || 0).getTime();
      const dateB = new Date(b.date || b['published-date'] || 0).getTime();
      return dateB - dateA;
    });
  }

  const { columns } = json;
  if (!Array.isArray(columns)) return [];

  const items = json.data.map((row) => {
    const item = {};
    row.forEach((value, index) => {
      item[columns[index]] = value;
    });
    return item;
  });

  return items.sort((a, b) => {
    const dateA = new Date(a.date || a['published-date'] || 0).getTime();
    const dateB = new Date(b.date || b['published-date'] || 0).getTime();
    return dateB - dateA;
  });
}

function filterByTags(items, filterTags) {
  if (!filterTags || !Array.isArray(filterTags) || filterTags.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const itemTags = item.tags || '';
    if (!itemTags) return false;

    const itemTagArray = itemTags.split(',').map((t) => t.trim().toLowerCase());
    return filterTags.some((filterTag) => {
      const filterTagLower = String(filterTag).toLowerCase();
      return itemTagArray.some((itemTag) => itemTag.includes(filterTagLower) || filterTagLower.includes(itemTag));
    });
  });
}

function buildCard(item) {
  const {
    path,
    title,
    subtitle,
    date,
    thumbnail,
  } = item;

  const cardEl = document.createElement('div');
  cardEl.classList.add('pr-card');

  const linkHref = typeof path === 'string' ? path : '#';

  // Image
  if (thumbnail) {
    const imageWrapper = document.createElement('a');
    imageWrapper.href = linkHref;
    imageWrapper.classList.add('pr-card-image');

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
  contentEl.classList.add('pr-card-content');

  // Eyebrow (use subtitle as category)
  if (subtitle) {
    const eyebrowEl = document.createElement('span');
    eyebrowEl.classList.add('pr-card-eyebrow');
    eyebrowEl.textContent = subtitle;
    contentEl.appendChild(eyebrowEl);
  }

  // Title
  if (title) {
    const titleLink = document.createElement('a');
    titleLink.href = linkHref;
    titleLink.classList.add('pr-card-title');
    titleLink.textContent = title;
    contentEl.appendChild(titleLink);
  }

  // Meta group - only show date
  const formattedDate = formatDate(date);
  if (formattedDate) {
    const metaGroupEl = document.createElement('div');
    metaGroupEl.classList.add('pr-card-meta-group');

    const dateEl = document.createElement('span');
    dateEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/clock-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    dateEl.appendChild(iconImg);
    dateEl.appendChild(document.createTextNode(formattedDate));
    metaGroupEl.appendChild(dateEl);

    contentEl.appendChild(metaGroupEl);
  }

  cardEl.appendChild(contentEl);

  return cardEl;
}

async function fetchPressReleaseData(endpoint) {
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, { credentials: 'same-origin' });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error('Failed to load press release data', response.status);
      return null;
    }
    return response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching press release data:', error);
    return null;
  }
}

function buildPaginationControls(container, state, onPageChange) {
  const { total, limit, offset } = state;

  const paginationEl = container.querySelector('.pr-pagination');
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

/**
 * Press Release Card Block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  const titleText = config.title || 'Related Press Releases';
  const endpoint = config.endpoint || '/us/en/newsroom.json';
  const filterTags = config['filter-tags'];
  const pageSize = Number.parseInt(config['page-size'], 10) || 3;
  const emptyText = config['empty-text'] || 'No press releases found.';
  const shouldPaginated = config['should-paginated'];
  const paginatedBtnText = config['paginated-btn-text'] || 'Load More';
  const discoverAllLink = config['discover-all-link'] || '';

  const blockResource = block.getAttribute('data-aue-resource');

  // Build static structure
  const container = document.createElement('div');
  container.className = 'pr-container';

  // Header with title and discover all link
  const headerEl = document.createElement('div');
  headerEl.className = 'pr-header';

  const sectionTitleEl = document.createElement('h3');
  sectionTitleEl.className = 'pr-title';
  sectionTitleEl.textContent = titleText;
  headerEl.appendChild(sectionTitleEl);

  if (discoverAllLink) {
    const discoverAllEl = document.createElement('a');
    discoverAllEl.href = discoverAllLink;
    discoverAllEl.className = 'pr-discover-all';
    discoverAllEl.textContent = 'Discover all news';
    headerEl.appendChild(discoverAllEl);
  }

  container.appendChild(headerEl);

  const cardGroupEl = document.createElement('div');
  cardGroupEl.className = 'pr-card-group';
  container.appendChild(cardGroupEl);

  // Pagination or Load More button
  const paginationEl = document.createElement('div');
  paginationEl.className = 'pr-pagination';

  const noPaginationEl = document.createElement('div');
  noPaginationEl.className = 'pr-no-pagination';
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.type = 'button';
  loadMoreBtn.classList.add('pr-load-more-btn');
  loadMoreBtn.textContent = paginatedBtnText;
  noPaginationEl.appendChild(loadMoreBtn);

  if (shouldPaginated === 'true' || shouldPaginated === true) {
    container.appendChild(paginationEl);
  } else {
    container.appendChild(noPaginationEl);
  }

  // Preserve instrumentation
  if (blockResource) {
    block.setAttribute('data-aue-resource', blockResource);
  }

  block.replaceChildren(container);

  // Fetch and render data
  const json = await fetchPressReleaseData(endpoint);
  let allItems = json ? normalizeNewsroomData(json) : [];

  // Filter by tags
  allItems = filterByTags(allItems, filterTags);

  let currentPage = 1;
  const totalPages = Math.ceil(allItems.length / pageSize);

  const loadPage = async (page) => {
    const totalItems = allItems.length;
    cardGroupEl.textContent = '';
    paginationEl.textContent = '';

    if (!totalItems) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'pr-empty';
      emptyEl.innerHTML = emptyText;
      cardGroupEl.appendChild(emptyEl);
      return;
    }

    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = allItems.slice(startIndex, startIndex + pageSize);

    pageItems.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });

    if (shouldPaginated === 'true' || shouldPaginated === true) {
      const state = {
        total: totalItems,
        limit: pageSize,
        offset: startIndex,
      };

      buildPaginationControls(container, state, (targetPage) => {
        if (targetPage < 1) return;
        const maxPage = Math.ceil(state.total / state.limit);
        if (targetPage > maxPage) return;
        currentPage = targetPage;
        loadPage(targetPage);
      });
    } else if (startIndex + pageSize < totalItems) {
      // Show load more button if there are more items
      loadMoreBtn.style.display = 'block';
    } else {
      loadMoreBtn.style.display = 'none';
    }
  };

  // Load More button click handler
  loadMoreBtn.addEventListener('click', () => {
    currentPage += 1;
    const startIndex = (currentPage - 1) * pageSize;
    const pageItems = allItems.slice(startIndex, startIndex + pageSize);

    pageItems.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });

    if (startIndex + pageSize >= allItems.length) {
      loadMoreBtn.style.display = 'none';
    }
  });

  await loadPage(1);

  block.classList.add('loaded');
}
