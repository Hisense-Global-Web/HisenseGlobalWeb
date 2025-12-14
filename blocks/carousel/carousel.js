import { moveInstrumentation } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * 更新活动幻灯片、指示器和链接的 ARIA 状态和 tabindex。
 * @param {HTMLElement} block - 整个轮播组件的根元素 (.carousel)。
 * @param {number} slideIndex - 当前活动幻灯片的索引。
 */
function updateActiveState(block, slideIndex) {
  // 1. 更新主状态
  block.dataset.activeSlide = String(slideIndex);

  // 2. 更新所有幻灯片的状态和可访问性 (tabindex)
  const slides = block.querySelectorAll('.carousel-item');
  slides.forEach((slide, idx) => {
    const isActive = idx === slideIndex;

    slide.setAttribute('aria-hidden', !isActive);

    // 禁用非活动幻灯片中的链接，以提高可访问性
    slide.querySelectorAll('a').forEach((link) => {
      link.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  });

  // 3. 更新所有指示器按钮的状态
  const indicators = block.querySelectorAll('.carousel-item-indicator button');
  indicators.forEach((button, idx) => {
    const isActive = idx === slideIndex;

    // 使用 disabled 和 aria-current 来标记活动状态 (用于CSS样式)
    button.setAttribute('aria-current', isActive);
    // 尽管设置了 aria-current，但指示器通常仍应保持可点击（不禁用）
    // 如果需要实现点击禁用效果（如你的原代码），则添加以下行：
    // button.disabled = isActive;
  });
}
/**
 * 滚动到指定的幻灯片索引。
 * @param {HTMLElement} block - 整个轮播组件的根元素 (.carousel)。
 * @param {number} slideIndex - 目标幻灯片的索引 (可以是负数或超出范围)。
 */
function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-item');
  const slidesCount = slides.length;

  // 循环逻辑：处理边界条件（首尾相连）
  let realSlideIndex = slideIndex % slidesCount;
  if (realSlideIndex < 0) {
    realSlideIndex += slidesCount;
  }

  const activeSlide = slides[realSlideIndex];

  // 滚动到目标位置
  block.querySelector('.carousel-items').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });

  // 在滚动完成后（或立即）更新状态
  updateActiveState(block, realSlideIndex);
}

/**
 * 绑定所有导航和指示器的事件监听器。
 * @param {HTMLElement} block - 整个轮播组件的根元素 (.carousel)。
 */
export function bindEvents(block) {
  // --- 1. 绑定指示器点击事件 ---
  const slideIndicators = block.querySelector('.carousel-item-indicators');
  if (slideIndicators) {
    slideIndicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const slideIndicator = e.currentTarget.parentElement;
        // 使用 showSlide 切换到目标索引
        showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      });
    });
  }

  // --- 2. 绑定 Prev/Next 按钮事件 ---
  const activeIndex = () => parseInt(block.dataset.activeSlide || '0', 10);

  block.querySelector('.slide-prev')?.addEventListener('click', () => {
    showSlide(block, activeIndex() - 1);
  });

  block.querySelector('.slide-next')?.addEventListener('click', () => {
    showSlide(block, activeIndex() + 1);
  });

  // --- 3. 绑定 IntersectionObserver ---
  // 用于在用户手动滚动时自动更新状态
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // 只有当幻灯片在视野内超过 50% 时才视为活动
      if (entry.isIntersecting) {
        const slideIndex = parseInt(entry.target.dataset.slideIndex, 10);
        updateActiveState(block, slideIndex);
      }
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-item').forEach((slide) => {
    slideObserver.observe(slide);
  });

  // 初始状态设置：确保在加载时显示第一张幻灯片的状态
  if (block.querySelectorAll('.carousel-item').length > 0) {
    updateActiveState(block, 0);
  }
}

function createSlide(row, slideIndex) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = String(slideIndex);
  slide.setAttribute('id', `carousel-item-${slideIndex}`);
  slide.classList.add('carousel-item');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-item-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}
export default async function decorate(block) {
  // carousel block
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;
  const wholeContainer = document.createElement('ul');
  wholeContainer.classList.add('carousel-items-container');

  wholeContainer.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '100%' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  // more than 2 image to create indicators & nav controls
  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.classList.add('carousel-indicators');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-item-indicators');
    slideIndicatorsNav.append(slideIndicators);
    wholeContainer.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="'Previous Slide'"></button>
      <button type="button" class="slide-next" aria-label="'Next Slide'"></button>
    `;
    wholeContainer.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx);
    wholeContainer.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-item-indicator');
      indicator.dataset.targetSlide = String(idx);
      // const btn = `<button type="button" class="indicator-button"></button>`;
      // indicator.innerHTML = btn;
      slideIndicators.append(indicator);
    }
    row.remove();
  });
  if (!isSingleSlide) {
    bindEvents(block);
  }

  block.prepend(wholeContainer);
}
