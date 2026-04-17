import { moveInstrumentation } from '../../scripts/scripts.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
function createScrollButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `scroll-btn scroll-${direction}`;
  button.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
  button.disabled = direction === 'left';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left-g.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right-g.svg`;
  img.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right.svg`;
  imgClick.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
  return button;
}

function buildTab(itemElement, index) {
  const li = document.createElement('li');
  li.className = 'product-filter-item';
  li['data-index'] = index;
  moveInstrumentation(itemElement, li);

  const cells = [...itemElement.children];

  const imageCell = cells.find((cell) => cell.querySelector('picture')) || cells[0];
  const videoHref = itemElement.querySelector('a')?.href;
  if (videoHref) {
    li.dataset.videoHref = videoHref;
  }

  const textCells = cells.filter((cell) => {
    const text = cell.textContent.trim();
    return text && !cell.querySelector('picture') && !cell.querySelector('a');
  });
  const textCell = textCells[1] || textCells[0] || cells[1] || cells[0];

  const imgBox = document.createElement('div');
  imgBox.className = 'product-filter-img-box';
  if (imageCell) {
    const picture = imageCell.querySelector('picture');
    if (videoHref) {
      const videoM = document.createElement('video');
      videoM.classList.add('autoplay-video');
      videoM.setAttribute('data-video-autoplay', 'true');
      videoM.controls = true;
      videoM.width = 640;
      videoM.preload = 'auto';
      videoM.playsInline = true;
      videoM.muted = true; // iPhone 要求静音才能自动播放
      const source = document.createElement('source');
      source.src = videoHref;
      source.type = 'video/mp4';
      videoM.innerHTML = '';
      videoM.appendChild(source);
      imgBox.replaceChildren(videoM);
    }
    if (picture) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'product-filter-img';
      moveInstrumentation(imageCell, imgWrapper);
      imgWrapper.appendChild(picture);
      imgBox.append(imgWrapper);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-filter-img placeholder';
      imgBox.append(placeholder);
    }
  }

  const textSpan = document.createElement('span');
  textSpan.className = 'product-filter-text';
  if (textCell) {
    const text = textCell.textContent.trim();
    if (text) {
      textSpan.textContent = text;
    }
    moveInstrumentation(textCell, textSpan);
  }
  li.addEventListener('click', (e) => {
    const mainVideoImg = document.querySelector('.pdp-main-img');
    const videoUrl = e.currentTarget.dataset.videoHref;
    if (videoUrl) {
      const video = document.createElement('video');
      video.classList.add('autoplay-video');
      video.setAttribute('data-video-autoplay', 'true');
      video.controls = true;
      video.width = 640;
      video.preload = 'auto';
      video.playsInline = true;
      video.muted = true; // iPhone 要求静音才能自动播放
      const source = document.createElement('source');
      source.src = videoUrl;
      source.type = 'video/mp4';
      video.innerHTML = '';
      video.appendChild(source);
      video.addEventListener('canplay', () => {
        video.play().catch(() => {});
      });

      mainVideoImg.replaceChildren(video);
      return;
    }
    const imgUrl = e.target?.src;
    const productElList = e.currentTarget.parentNode.querySelectorAll('.product-filter-item');
    productElList.forEach((el) => {
      el.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    if (mainVideoImg) {
      const img = document.createElement('img');
      img.src = imgUrl;
      mainVideoImg.replaceChildren(img);
    }
  });

  li.append(imgBox, textSpan);
  return li;
}

function buildTabDot(itemElement, index) {
  const li = document.createElement('li');
  li.className = 'product-indicator';
  li['data-index'] = index;

  const div = document.createElement('div');
  div.className = 'indicator-button';

  li.addEventListener('click', () => {
    // 需求变更，点击功能注释
    return;
    // eslint-disable-next-line no-unreachable
    const filterItems = document.querySelectorAll('.product-filter-item');
    // 滚动到对应图片的位置
    filterItems[index].scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
    });
  });

  li.append(div);
  return li;
}

function updateButtons(tabsList, leftBtn, rightBtn) {
  leftBtn.disabled = tabsList.scrollLeft <= 0;
  rightBtn.disabled = tabsList.scrollLeft + tabsList.clientWidth + 10 >= tabsList.scrollWidth;
}

// 防抖函数
function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// 计算并对齐到最近的item（手机端专用）
function alignToWholeItemMobile(tabsList) {
  const isMobile = window.innerWidth < 860;
  if (!isMobile) return;

  const firstItem = tabsList.querySelector('.product-filter-item');
  if (!firstItem) return;

  // 手机端item宽度是100vw，间距10px（从css中获取）
  const itemWidth = window.innerWidth + 10; // 手机端每个item占满宽度
  const currentScroll = tabsList.scrollLeft;
  // 计算当前滚动位置相对于item宽度的比例
  const scrollRatio = currentScroll % itemWidth;
  const currentItemIndex = Math.floor(currentScroll / itemWidth);

  let targetScroll;
  // 超过50%则滚动到下一个item，否则回到当前item
  if (scrollRatio > itemWidth * 0.5) {
    targetScroll = (currentItemIndex + 1) * itemWidth;
    // 边界判断：不超过最大滚动值
    const maxScroll = tabsList.scrollWidth - tabsList.clientWidth;
    targetScroll = Math.min(targetScroll, maxScroll);
  } else {
    targetScroll = currentItemIndex * itemWidth;
  }

  // 滚动到目标位置
  tabsList.scrollTo({ left: targetScroll, behavior: 'smooth' });
  // 更新按钮状态
  const leftBtn = document.querySelector('.scroll-left');
  const rightBtn = document.querySelector('.scroll-right');
  if (leftBtn && rightBtn) {
    updateButtons(tabsList, leftBtn, rightBtn);
  }
}

function attachScrollHandlers(tabsList, leftBtn, rightBtn) {
  // 左箭头
  leftBtn.addEventListener('click', () => {
    const SCROLL_STEP = (134 * Math.min(window.innerWidth, 1440)) / 1440;
    tabsList.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
    setTimeout(() => {
      updateButtons(tabsList, leftBtn, rightBtn);
    }, 300);
  });

  // 右箭头
  rightBtn.addEventListener('click', () => {
    const SCROLL_STEP = (134 * Math.min(window.innerWidth, 1440)) / 1440;
    tabsList.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
    setTimeout(() => {
      updateButtons(tabsList, leftBtn, rightBtn);
    }, 300);
  });

  // 手机端滚动防抖处理（200ms延迟，确保滚动停止后触发）
  const debounceAlignToItem = debounce(() => {
    alignToWholeItemMobile(tabsList);
  }, 200);

  tabsList.addEventListener('scroll', () => {
    updateButtons(tabsList, leftBtn, rightBtn);
    // 手机端滚动停止后对齐
    const isMobile = window.innerWidth < 860;
    if (isMobile) {
      debounceAlignToItem();
    }
  });

  // ---------- 核心修复：resize 自动对齐校正 ----------
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 860;
    const firstItem = tabsList.querySelector('.product-filter-item');
    if (firstItem) {
      if (isMobile) {
        // 手机端item宽度为100vw
        const itemWidth = window.innerWidth;
        const closestScroll = Math.round(tabsList.scrollLeft / itemWidth) * itemWidth;
        tabsList.scrollTo({ left: closestScroll, behavior: 'instant' });
      } else {
        // 桌面端原有逻辑
        const itemWidth = firstItem.offsetWidth + 16; // 包含间距
        const closestScroll = Math.round(tabsList.scrollLeft / itemWidth) * itemWidth;
        tabsList.scrollTo({ left: closestScroll, behavior: 'instant' });
      }
    }

    updateButtons(tabsList, leftBtn, rightBtn);
  });

  updateButtons(tabsList, leftBtn, rightBtn);
}

function updateActiveDot() {
  const filterItems = document.querySelectorAll('.product-filter-item');
  const dots = document.querySelectorAll('.product-indicator');
  filterItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const isActive = rect.left <= 0;

    if (isActive) {
      dots.forEach((d) => d.classList.remove('active'));
      dots[index].classList.add('active');

      if (item.dataset.videoHref) {
        const v = item.querySelector('video');
        v.play().catch(() => {});
      }
    }
  });
}

export default function decorate(block) {
  // 编辑模式,如果有data-aue-resource 属性，说明现在浏览的是编辑模式
  const isEditMode = block.hasAttribute('data-aue-resource');

  const tabs = document.createElement('ul');
  tabs.className = 'product-filters';
  const dots = document.createElement('ul');
  dots.className = 'product-carousel';

  let itemElements = [...block.children];
  if (isEditMode) {
    const nodeList = block.querySelectorAll('[data-aue-model="product-filters-carousel-item"], [data-aue-type="component"][data-aue-model]');
    itemElements = [...nodeList];
  }

  itemElements.forEach((item, index) => {
    const itemClone1 = item.cloneNode(true);
    const itemClone2 = item.cloneNode(true);
    const li = buildTab(itemClone1, index);
    const resource = itemClone1.getAttribute && itemClone1.getAttribute('data-aue-resource');
    if (resource) {
      // 保留 data-aue-resource，用于编辑
      li.setAttribute('data-aue-resource', resource);
    }
    tabs.append(li);

    const dotLi = buildTabDot(itemClone2, index);
    if (index === 0) {
      dotLi.classList.add('active');
    }
    dots.append(dotLi);
  });

  tabs.addEventListener('scroll', updateActiveDot);

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  tabsContainer.append(tabs, dots);

  const leftBtn = createScrollButton('left');
  const rightBtn = createScrollButton('right');
  attachScrollHandlers(tabs, leftBtn, rightBtn);

  const scrollTabs = document.createElement('div');
  scrollTabs.className = 'scroll-tabs';
  scrollTabs.append(leftBtn, tabsContainer, rightBtn);
  if (tabs?.childElementCount > 4) {
    rightBtn.removeAttribute('disabled');
  }
  const media = document.createElement('div');
  media.className = 'pdp-media';
  const mediaImg = document.createElement('div');
  mediaImg.className = 'pdp-main-img';
  if (tabs?.childElementCount) {
    const firstImg = tabs.querySelector('.product-filter-img-box .product-filter-img img');
    if (firstImg) {
      mediaImg.append(firstImg.cloneNode(true));
    }
  }
  media.append(mediaImg);
  media.append(scrollTabs);

  window.addEventListener('scroll', () => {
    const mediaRect = media.getBoundingClientRect();
    const navigation = document.querySelector('#navigation');
    if (!navigation) return;
    if (mediaRect.top < 0) {
      navigation.classList.add('scroll-active');
    } else {
      navigation.classList.remove('scroll-active');
    }
  });

  block.replaceChildren(media);
}
