import {
  whenElementReady,
  getSlideWidth,
  getChildSlideWidth,
  throttle,
  mobilePressEffect,
} from '../../utils/carousel-common.js';
import { createElement } from '../../utils/dom-helper.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';

const cardCarouselId = 0;
const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
export function bindEvent(block, type = 'normal') {
  const track = block.querySelector('.card-carousel-track');
  const cards = block.querySelectorAll('li');
  const viewportWidth = block.querySelector('.card-carousel-viewport').offsetWidth;
  const prevBtn = block.querySelector('.slide-prev');
  const nextBtn = block.querySelector('.slide-next');
  const gap = parseInt(window.getComputedStyle(block.querySelector('.card-carousel-track')).gap, 10) || 0;
  const CONFIG = {
    itemWidth: getChildSlideWidth(block),
    gap,
    containerWidth: viewportWidth,
    totalItems: cards.length,
  };

  if (cards.length * getSlideWidth(block) - gap >= viewportWidth) {
    block.querySelector('.card-carousel-pagination').classList.add('show');
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
    // 如果剩余距离不足一个 step + 1，则直接滑动到底对齐
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

  if (isUniversalEditor()) return;
  // 初始化
  updateState();
  if (type === 'resize') return;
  let lastWidth = window.innerWidth;

  window.onresize = throttle(() => {
    const currentWidth = window.innerWidth;
    if (currentWidth !== lastWidth) {
      const blocks = document.querySelectorAll('.card-carousel');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const v = entry.target;
            const currentBlock = document.getElementById(v.id);
            bindEvent(currentBlock, 'resize');
          }
        });
      }, { threshold: 0.5 });

      blocks.forEach((blockItem) => {
        observer.observe(blockItem);
      });
      lastWidth = currentWidth;
    }
  }, 300);

  // text-left type展示button组件，卡片不需要点击，通过button跳转
  if (!block.classList.contains('text-left')) {
    const goToNextPage = (card) => {
      const link = card.querySelector('a');
      const url = link?.href;
      card.addEventListener('click', () => {
        if (url) window.location.href = url;
      });
    };
    cards.forEach((card) => {
      mobilePressEffect(viewportWidth, card, () => {
        goToNextPage(card);
      });
    });
  }
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
export default async function decorate(block) {
  block.dataset.slideIndex = 0;
  block.setAttribute('id', `card-carousel-${cardCarouselId}`);
  const cardCarouselContainer = createElement('div', 'card-carousel-viewport');
  const cardCarouselBlocks = createElement('ul', 'card-carousel-track');
  const titleBox = createElement('div', 'card-carousel-title-box');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx <= 1) {
      titleBox.appendChild(child);
      return;
    }
    const cardCarouselBlock = document.createElement('li');
    child.classList.add('item');
    let ctaDiv;
    [...child.children].forEach((item, _i) => {
      switch (_i) {
        case 0:
          item.classList.add('item-picture');
          break;
        case 2:
          item.classList.add('item-cta');
          if (block.classList.contains('text-left')) item.classList.add('show');
          // cta 和label不能自动组合
          if ([...item.children].length === 2) {
            item.querySelector('a').innerHTML = item.lastElementChild.innerHTML;
            item.lastElementChild.remove();
          }
          ctaDiv = item;
          break;
        default:
          item.classList.add('item-text');
      }
      if (!item.innerHTML) item.remove();
    });
    cardCarouselBlock.appendChild(child);
    cardCarouselBlock.appendChild(ctaDiv);
    cardCarouselBlocks.appendChild(cardCarouselBlock);
  });
  cardCarouselContainer.appendChild(cardCarouselBlocks);
  block.appendChild(titleBox);
  block.appendChild(cardCarouselContainer);

  if (cardCarouselBlocks.children) {
    const buttonContainer = createElement('div', 'card-carousel-pagination');
    buttonContainer.appendChild(createScrollButton('prev'));
    buttonContainer.appendChild(createScrollButton('next'));
    titleBox.lastElementChild.appendChild(buttonContainer);
  }
  whenElementReady('.card-carousel', () => {
    block.dataset.currentIndex = 0;
    bindEvent(block);
  });
}
