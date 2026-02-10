import {
  getSlideWidth,
  getChildSlideWidth,
  whenElementReady,
} from '../../utils/carousel-common.js';
import { createElement } from '../../utils/dom-helper.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';

let carouselId = 0;

function bindEvent(block, type = 'normal') {
  const track = block.querySelector('.media-carousel-track');
  if (window.innerWidth < 860) {
    track.style.transform = 'none';
  }
  const videos = block.querySelectorAll('.video-autoPlay');
  const prevBtn = block.querySelector('.slide-prev');
  const nextBtn = block.querySelector('.slide-next');
  const cards = block.querySelectorAll('.item');
  let maxWidth = block.querySelector('.media-carousel-viewport').offsetWidth;
  if (block.classList.contains('bottom-center-style')) {
    maxWidth = block.offsetWidth;
  }
  const gap = parseInt(window.getComputedStyle(block.querySelector('.media-carousel-track')).gap, 10) || 0;
  const CONFIG = {
    itemWidth: getChildSlideWidth(block),
    gap,
    containerWidth: maxWidth,
    totalItems: cards.length,
  };
  if (cards.length * getSlideWidth(block) - gap >= maxWidth) {
    block.querySelector('.media-carousel-pagination').classList.add('show');
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

  const playSoloVideo = (index) => {
    videos.forEach((v, i) => {
      if (i === index) {
        v.parentElement.classList.add('is-playing');
        v.click();
        v.muted = true;
        v.nextElementSibling.style.display = 'none'; // 隐藏封面图
        v.play().catch(() => {}); // 捕获浏览器静音播放策略错误
      } else {
        v.pause();
        v.currentTime = 0; // 重置进度
        v.parentElement.classList.remove('is-playing');
      }
    });
  };

  // 更新状态与播放
  const updateState = () => {
    if (Math.abs(currentX) > maxTranslate && type === 'resize') {
      currentX = -maxTranslate;
    }
    track.style.transform = `translateX(${currentX}px)`;
    block.dataset.currentIndex = currentIndex;
    if (currentX === 0) {
      block.dataset.currentIndex = 0;
    }
    // 按钮禁用状态
    prevBtn.disabled = currentX >= 0;
    nextBtn.disabled = Math.abs(currentX) >= maxTranslate;

    // 自动播放逻辑：计算当前最靠左的索引
    // 最后一次点击时，Math.abs(currentX) 会等于 maxTranslate
    let activeIndex = Math.round(Math.abs(currentX) / step);

    // 如果已经滑动到底部（对齐了最后一个），强制播放最后一个
    if (Math.abs(currentX) >= maxTranslate - 10) {
      activeIndex = CONFIG.totalItems - 1;
    }
    if (block.classList.contains('video-media-carousel-block')) {
      playSoloVideo(activeIndex);
    }
  };

  // 按钮点击事件
  nextBtn.addEventListener('click', () => {
    const remaining = maxTranslate - Math.abs(currentX);
    if (remaining <= 0) return;
    // 如果剩余距离不足一个 step，则直接滑动到底对齐
    currentIndex += 1;
    if (remaining < step) {
      currentX = -maxTranslate;
      if (block.classList.contains('bottom-center-style')) {
        const { marginRight } = window.getComputedStyle(block.querySelector('.media-carousel-viewport'));
        currentX -= parseInt(marginRight, 10) || 0; // 考虑 margin-right 的影响
      }
    } else {
      currentX -= step;
    }
    updateState();
  });

  prevBtn.addEventListener('click', () => {
    if (currentX >= 0) return;
    currentIndex -= 1;
    // 往回走时，如果距离起点不足一个 step，直接归零
    if (Math.abs(currentX) < step) {
      currentX = 0;
    } else {
      currentX += step;
    }
    updateState();
  });

  // 手动点击封面播放
  const videoItems = block.querySelectorAll('.video-div-box img');
  videoItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      item.style.display = 'none'; // 隐藏封面图
      playSoloVideo(idx);
    });
  });

  if (isUniversalEditor()) return;
  // 初始化
  updateState();
  if (type === 'resize') return;
  let lastWidth = window.innerWidth;

  window.onresize = () => {
    const currentWidth = window.innerWidth;
    if (currentWidth !== lastWidth) {
      const blocks = document.querySelectorAll('.media-carousel');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const v = entry.target;
            const currentBlock = document.getElementById(v.id);
            // bindEvent(currentBlock);
            bindEvent(currentBlock, 'resize');
          }
        });
      }, { threshold: 0.5 });

      blocks.forEach((blockItem) => {
        observer.observe(blockItem);
      });
      lastWidth = currentWidth;
    }
  };
}

function createVideo(child, idx) {
  let videourl;
  const link = child.querySelector('a');
  if (link) {
    videourl = link.href;
  }
  const videoDivDom = createElement('div', 'video-div-box');
  const img = child.querySelector('img');
  const video = createElement('video', 'video-autoPlay');
  video.id = `video-${carouselId}-carousel-${idx - 2}`;
  video.controls = true;
  video.preload = 'auto';
  video.autoplay = false;
  video.loop = true;
  const source = document.createElement('source');
  source.src = videourl; // 替换为你的视频
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('data-is-playing', 'false');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('x5-playsinline', '');
  video.setAttribute('playsinline', true);
  video.appendChild(source);
  videoDivDom.appendChild(video);
  videoDivDom.appendChild(img);
  return videoDivDom;
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
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `media-carousel-${carouselId}`);
  block.dataset.slideIndex = 0;
  const contentType = block.children[2].innerHTML.includes('video') ? 'video' : 'Image';
  const mediaCarouselContainer = createElement('div', 'media-carousel-viewport');
  const mediaCarouselBlocks = createElement('ul', 'media-carousel-track');
  const titleBox = createElement('div', 'carousel-title-box');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx <= 2) {
      if (idx !== 2) {
        titleBox.appendChild(child);
      }
      else child.remove();
      return;
    }
    const mediaBlock = document.createElement('li');
    child.classList.add('item');
    mediaBlock.dataset.slideIndex = idx - 3;
    if (contentType === 'video') {
      block.classList.add('video-media-carousel-block');
      let singleVideo;
      if (block.classList.contains('bottom-center-style')) {
        child.classList.add('video-center-type');
        singleVideo = createVideo(child, idx);
      } else {
        singleVideo = createVideo(child, idx);
        child.classList.add('video-only');
      }
      if (child.querySelector('picture')) {
        child.querySelector('picture').closest('div').classList.add('video-play');
        child.querySelector('picture').closest('div').remove();
      }
      if (singleVideo && child.firstElementChild.querySelector('a')) child.replaceChild(singleVideo, child.firstElementChild);
      child.lastElementChild?.classList.add('item-content');
    } else {
      [...child.children].forEach((item) => {
        if (item.querySelector('picture')) {
          item.querySelector('picture').closest('div').classList.add('item-picture');
        } else if (item.querySelector('.button-container')) {
          item.querySelector('.button-container').closest('div').classList.add('item-cta');
        } else {
          item.classList.add('item-content');
        }
        if (!item.innerHTML) item.remove();
      });
    }
    mediaBlock.appendChild(child);
    mediaCarouselBlocks.appendChild(mediaBlock);
  });
  mediaCarouselContainer.appendChild(mediaCarouselBlocks);
  if (titleBox.firstElementChild.textContent.trim() === '') {
    // If the first child is empty, the title font-size should be smaller
    titleBox.lastElementChild.classList.add('no-subtitle');
    titleBox.classList.add('only-title');
  }
  block.appendChild(titleBox);
  block.appendChild(mediaCarouselContainer);

  if (mediaCarouselBlocks.children) {
    const buttonContainer = createElement('div', 'media-carousel-pagination');
    buttonContainer.appendChild(createScrollButton('prev'));
    buttonContainer.appendChild(createScrollButton('next'));
    titleBox.lastElementChild.appendChild(buttonContainer);
  }
  whenElementReady('.media-carousel', () => {
    block.dataset.currentIndex = 0;
    bindEvent(block);
  });
}
