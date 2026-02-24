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
  let tagArray = [];
  if (typeof filterTags === 'string') {
    tagArray = filterTags.split(',').map((t) => t.trim()).filter((t) => t);
  } else if (Array.isArray(filterTags)) {
    tagArray = filterTags;
  }

  if (!tagArray || tagArray.length === 0) {
    return items;
  }

  return items.filter((item) => {
    const itemTags = item.tags || '';
    if (!itemTags) return false;

    const itemTagArray = itemTags.split(',').map((t) => t.trim().toLowerCase());
    return tagArray.some((filterTag) => {
      const filterTagLower = String(filterTag).toLowerCase();
      return itemTagArray.some((itemTag) => itemTag === filterTagLower || itemTag.includes(filterTagLower));
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
  const discoverAllLinkText = config['discover-all-link-text'] || 'Discover all news';
  const discoverAllLink = config['discover-all-link'] || '';

  const blockResource = block.getAttribute('data-aue-resource');

  // Build static structure
  const container = document.createElement('div');
  container.className = 'pr-container';

  // Header
  const headerEl = document.createElement('div');
  headerEl.className = 'pr-header';

  const sectionTitleEl = document.createElement('h3');
  sectionTitleEl.className = 'pr-title';
  sectionTitleEl.textContent = titleText;
  headerEl.appendChild(sectionTitleEl);

  container.appendChild(headerEl);

  const cardGroupEl = document.createElement('div');
  cardGroupEl.className = 'pr-card-group';
  container.appendChild(cardGroupEl);

  // Discover All button
  if (discoverAllLink) {
    const discoverAllContainer = document.createElement('div');
    discoverAllContainer.className = 'pr-discover-all-container';

    const discoverAllEl = document.createElement('a');
    discoverAllEl.href = discoverAllLink;
    discoverAllEl.className = 'pr-discover-all';
    discoverAllEl.textContent = discoverAllLinkText;
    discoverAllContainer.appendChild(discoverAllEl);

    container.appendChild(discoverAllContainer);
  }

  // Preserve instrumentation
  if (blockResource) {
    block.setAttribute('data-aue-resource', blockResource);
  }

  block.replaceChildren(container);

  const json = await fetchPressReleaseData(endpoint);
  const allItems = json ? normalizeNewsroomData(json) : [];

  // Filter by tags
  const filteredItems = filterByTags(allItems, filterTags);

  const itemsToShow = filteredItems.slice(0, pageSize);

  if (!filteredItems.length) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'pr-empty';
    emptyEl.innerHTML = emptyText;
    cardGroupEl.appendChild(emptyEl);
  } else {
    itemsToShow.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });
  }

  block.classList.add('loaded');
}
