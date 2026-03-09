import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import {
  whenElementReady,
  getSlideWidth,
  getChildSlideWidth,
  throttle,
} from '../../utils/carousel-common.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
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

function bindEvent(block, type = 'normal') {
  const track = block.querySelector('.news-card-group');
  const cards = block.querySelectorAll('.news-card');
  if (!cards.length) return;
  const viewportWidth = block.querySelector('.news-container').offsetWidth;
  const prevBtn = block.closest('.section').querySelector('.slide-prev');
  const nextBtn = block.closest('.section').querySelector('.slide-next');
  const gap = parseFloat(window.getComputedStyle(block.querySelector('.news-card-group')).gap) || 0;
  const CONFIG = {
    itemWidth: getChildSlideWidth(block),
    gap,
    containerWidth: viewportWidth,
    totalItems: cards.length,
  };

  if (cards.length * getSlideWidth(block) - gap >= viewportWidth) {
    block.closest('.section').querySelector('.has-button').querySelector('.button-container').classList.add('show');
  } else {
    return;
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
    iconImg.src = `/content/dam/hisense/${country}/common-icons/download.svg`;
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
  img.src = direction === 'prev' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left-g.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right-g.svg`;
  img.alt = direction === 'prev' ? 'slide-prev' : 'slide-next';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'prev' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right.svg`;
  imgClick.alt = direction === 'prev' ? 'slide-prev' : 'slide-next';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
  return button;
}

async function fetchRelatedNews(endpoint) {
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
 * Related News Block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  const endpoint = config.graphql || '';
  const filterTags = config.tag;

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

  const json = await fetchRelatedNews(endpoint);
  const allItems = json ? normalizeNewsroomData(json) : [];

  // Filter by tags
  const filteredItems = filterByTags(allItems, filterTags);
  const maxShowCard = 6;
  const itemsToShow = filteredItems.slice(0, maxShowCard);
  if (!filteredItems.length) {
    // const emptyEl = document.createElement('div');
    // emptyEl.className = 'pr-empty';
    // emptyEl.innerHTML = emptyText;
    // cardGroupEl.appendChild(emptyEl);
  } else {
    itemsToShow.forEach((item) => {
      const card = buildCard(item);
      cardGroupEl.appendChild(card);
    });
    // carousel arrow
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
  }
  block.classList.add('loaded');
  whenElementReady('.related-news', () => {
    block.dataset.currentIndex = 0;
    bindEvent(block);
  });
}
