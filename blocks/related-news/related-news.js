import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  whenElementReady,
  getSlideWidth,
  getChildSlideWidth,
  throttle,
} from '../../utils/carousel-common.js';

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
    keywords: 'Hisense, ESG, AI, Sustainability',
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
    keywords: 'Hisense, Technology, Innovation',
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
    keywords: 'Hisense, ESG, Strategy',
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
    keywords: 'Hisense, ESG, Technology',
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
          || lowerIncludes(field, spaceValue)).filter((v, i) => i <= 6);
      }

      return searchableFields.some((field) => lowerIncludes(field, value)).filter((v, i) => i <= 6);
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

function bindEvent(block, type = 'normal') {
  const track = block.querySelector('.news-card-group');
  const cards = block.querySelectorAll('.news-card');
  const viewportWidth = block.querySelector('.news-container').offsetWidth;
  const prevBtn = block.closest('.section').querySelector('.slide-prev');
  const nextBtn = block.closest('.section').querySelector('.slide-next');
  const gap = parseInt(window.getComputedStyle(block.querySelector('.news-card-group')).gap, 10) || 0;
  const CONFIG = {
    itemWidth: getChildSlideWidth(block),
    gap,
    containerWidth: viewportWidth,
    totalItems: cards.length,
  };

  if (cards.length * getSlideWidth(block) - gap >= viewportWidth) {
    block.closest('.section').querySelector('.has-button').querySelector('.button-container').classList.add('show');
  }

  const step = CONFIG.itemWidth + CONFIG.gap;
  const totalTrackWidth = (CONFIG.totalItems * CONFIG.itemWidth) + ((CONFIG.totalItems - 1) * CONFIG.gap);
  const maxTranslate = totalTrackWidth - CONFIG.containerWidth; // 最大的负向偏移量

  let currentX = 0;
  let currentIndex = 0;

  if (type === 'resize') {
    currentX = -parseInt(block.dataset.currentIndex, 10) * step;
    currentIndex = parseInt(block.dataset.currentIndex, 10) || 0;
  }

  // 更新状态
  const updateState = () => {
    if (Math.abs(currentX) > maxTranslate && type === 'resize') {
      currentX = -maxTranslate;
    }
    track.style.transform = `translateX(${currentX}px)`;
    if (window.innerWidth < 860) {
      track.style.transform = 'none';
    }
    block.dataset.currentIndex = currentIndex;
    if (currentX === 0) {
      block.dataset.currentIndex = 0;
    }
    // 按钮禁用状态
    prevBtn.disabled = currentX >= 0;
    nextBtn.disabled = Math.abs(currentX) >= maxTranslate;
  };

  // 按钮点击事件
  nextBtn.addEventListener('click', () => {
    const remaining = maxTranslate - Math.abs(currentX);
    if (remaining <= 0) return;
    // 如果剩余距离不足一个 step，则直接滑动到底对齐
    currentIndex += 1;
    if (remaining < (step + 1)) {
      currentX = -maxTranslate;
    } else {
      currentX -= step;
    }
    updateState();
  });

  prevBtn.addEventListener('click', () => {
    if (currentX >= 0) return;
    currentIndex -= 1;
    // 往回走时，如果距离起点不足一个 step，直接归零
    if (Math.abs(currentX) < (step + 1)) {
      currentX = 0;
    } else {
      currentX += step;
    }
    updateState();
  });

  // 初始化
  updateState();
  if (type === 'resize') return;
  let lastWidth = window.innerWidth;

  window.onresize = throttle(() => {
    const currentWidth = window.innerWidth;
    if (currentWidth !== lastWidth) {
      bindEvent(block, 'resize');
      lastWidth = currentWidth;
    }
  }, 300);
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

  const cardEl = document.createElement('li');
  cardEl.classList.add('news-card');

  const linkHref = typeof path === 'string' ? path : '#';

  // Image
  if (thumbnail) {
    const imageWrapper = document.createElement('a');
    imageWrapper.href = linkHref;
    imageWrapper.classList.add('news-image');

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
  contentEl.classList.add('news-content');
  const textEl = document.createElement('div');
  textEl.classList.add('news-text');
  contentEl.appendChild(textEl);
  // Eyebrow (use subtitle as category)
  if (subtitle) {
    const eyebrowEl = document.createElement('div');
    eyebrowEl.classList.add('news-eyebrow');
    eyebrowEl.textContent = subtitle;
    textEl.appendChild(eyebrowEl);
  }

  // Title
  if (title) {
    const titleLink = document.createElement('a');
    titleLink.href = linkHref;
    titleLink.classList.add('news-subtitle');
    titleLink.textContent = title;
    textEl.appendChild(titleLink);
  }

  // Meta group
  const metaGroupEl = document.createElement('div');
  metaGroupEl.classList.add('news-meta-group');

  const formattedDate = formatDate(date);
  if (formattedDate) {
    const dateEl = document.createElement('span');
    dateEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/clock-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    dateEl.appendChild(iconImg);
    const dateSpan = document.createElement('span');
    dateSpan.textContent = formattedDate;
    dateEl.appendChild(dateSpan);
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
    const locationSpan = document.createElement('span');
    locationSpan.textContent = location;
    locationEl.appendChild(locationSpan);
    metaGroupEl.appendChild(locationEl);
  }

  if (download) {
    const downloadEl = document.createElement('span');
    downloadEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/content/dam/hisense/us/common-icons/download.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon download');
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

function createScrollButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `slide-${direction}`;
  button.setAttribute('aria-label', direction === 'prev' ? 'slide-prev' : 'slide-next');
  button.disabled = direction === 'prev';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'prev' ? '/content/dam/hisense/us/common-icons/icon-carousel/nav-left-g.svg' : '/content/dam/hisense/us/common-icons/icon-carousel/nav-right-g.svg';
  img.alt = direction === 'prev' ? 'slide-prev' : 'slide-next';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'prev' ? '/content/dam/hisense/us/common-icons/icon-carousel/nav-left.svg' : '/content/dam/hisense/us/common-icons/icon-carousel/nav-right.svg';
  imgClick.alt = direction === 'prev' ? 'slide-prev' : 'slide-next';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
  return button;
}

async function fetchNewsroom() {
  const { pathname } = window.location;

  // /content 开头，使用本地 mock 数据，避免跨域请求失败
  if (pathname.startsWith('/content')) {
    return {
      data: MOCK_NEWSROOM_ITEMS,
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

async function loadAllNewsroom() {
  const json = await fetchNewsroom();
  if (!json) return [];
  return normalizeNewsroomData(json);
}

/**
 * Related News Block
 */
export default async function decorate(block) {
  const blockResource = block.getAttribute('data-aue-resource');

  // Build static structure
  const container = document.createElement('div');
  container.className = 'news-container';

  const cardGroupEl = document.createElement('ul');
  cardGroupEl.className = 'news-card-group';
  container.appendChild(cardGroupEl);

  // Ensure the editor can still find this block
  if (blockResource) {
    block.setAttribute('data-aue-resource', blockResource);
  }

  block.replaceChildren(container);
  const allItems = await loadAllNewsroom();
  const loadPage = async () => {
    const filteredItems = filterItemsByUrlParams(allItems);

    cardGroupEl.textContent = '';
    filteredItems.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });
  };

  await loadPage();

  const prevButton = createScrollButton('prev');
  const nextButton = createScrollButton('next');
  const sectionTitle = block.closest('.section').querySelector('.module-title');
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  buttonContainer.appendChild(prevButton);
  buttonContainer.appendChild(nextButton);
  if (sectionTitle) {
    sectionTitle.lastElementChild.appendChild(buttonContainer);
    sectionTitle.lastElementChild.classList.add('has-button');
  }
  block.dataset.slideIndex = 0;
  block.classList.add('loaded');
  whenElementReady('.related-news', () => {
    block.dataset.currentIndex = 0;
    bindEvent(block);
  });
}
