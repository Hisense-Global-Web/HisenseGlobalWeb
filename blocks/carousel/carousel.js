import { moveInstrumentation } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

// function updateActiveState(block, slideIndex) {
//   block.dataset.activeSlide = String(slideIndex);
//   const slides = block.querySelectorAll('.carousel-item');
//   slides.forEach((slide, idx) => {
//     const isActive = idx === slideIndex;
//
//     slide.setAttribute('aria-hidden', String(!isActive));
//     slide.querySelectorAll('a').forEach((link) => {
//       link.setAttribute('tabindex', isActive ? '0' : '-1');
//     });
//   });
//   const indicators = block.querySelectorAll('.carousel-item-indicator button');
//   indicators.forEach((button, idx) => {
//     const isActive = idx === slideIndex;
//     button.setAttribute('aria-current', String(isActive));
//   });
// }

// function showSlide(block, slideIndex = 0) {
//   const slides = block.querySelectorAll('.carousel-item');
//   const slidesCount = slides.length;
//
//   // 循环逻辑：处理边界条件（首尾相连）
//   let realSlideIndex = slideIndex % slidesCount;
//   if (realSlideIndex < 0) {
//     realSlideIndex += slidesCount;
//   }
//
//   const activeSlide = slides[realSlideIndex];
//
//   // 滚动到目标位置
//   block.querySelector('.carousel-items').scrollTo({
//     top: 0,
//     left: activeSlide.offsetLeft,
//     behavior: 'smooth',
//   });
//
//   // 在滚动完成后（或立即）更新状态
//   updateActiveState(block, realSlideIndex);
// }

// export function bindEvents(block) {
//   // --- 1. 绑定指示器点击事件 ---
//   const slideIndicators = block.querySelector('.carousel-item-indicators');
//   if (slideIndicators) {
//     slideIndicators.querySelectorAll('button').forEach((button) => {
//       button.addEventListener('click', (e) => {
//         const slideIndicator = e.currentTarget.parentElement;
//         // 使用 showSlide 切换到目标索引
//         showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
//       });
//     });
//   }
//
//   // --- 2. 绑定 Prev/Next 按钮事件 ---
//   const activeIndex = () => parseInt(block.dataset.activeSlide || '0', 10);
//
//   block.querySelector('.slide-prev')?.addEventListener('click', () => {
//     showSlide(block, activeIndex() - 1);
//   });
//
//   block.querySelector('.slide-next')?.addEventListener('click', () => {
//     showSlide(block, activeIndex() + 1);
//   });
//
//   // --- 3. 绑定 IntersectionObserver ---
//   // 用于在用户手动滚动时自动更新状态
//   const slideObserver = new IntersectionObserver((entries) => {
//     entries.forEach((entry) => {
//       // 只有当幻灯片在视野内超过 50% 时才视为活动
//       if (entry.isIntersecting) {
//         const slideIndex = parseInt(entry.target.dataset.slideIndex, 10);
//         updateActiveState(block, slideIndex);
//       }
//     });
//   }, { threshold: 0.5 });
//
//   block.querySelectorAll('.carousel-item').forEach((slide) => {
//     slideObserver.observe(slide);
//   });
//
//   // 初始状态设置：确保在加载时显示第一张幻灯片的状态
//   if (block.querySelectorAll('.carousel-item').length > 0) {
//     updateActiveState(block, 0);
//   }
// }

function createSlide(row, slideIndex) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = String(slideIndex);
  slide.classList.add('carousel-item');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    if (colIdx === 0) column.classList.add('carousel-item-image');
    else if (colIdx === 1) column.classList.add('carousel-item-content');
    else column.classList.add('carousel-item-cta');
    slide.append(column);
  });
  return slide;
}
export default async function decorate(block) {
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;
  const wholeContainer = document.createElement('ul');
  wholeContainer.classList.add('carousel-items-container');
  block.prepend(wholeContainer);
  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.classList.add('indicators');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-item-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="'Previous Slide'"></button>
      <button type="button" class="slide-next" aria-label="'Next Slide'"></button>
    `;
    block.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx);
    wholeContainer.append(slide);
    wholeContainer.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '100%' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });
    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-item-indicator');
      indicator.dataset.targetSlide = String(idx);
      slideIndicators.append(indicator);
    }
    row.remove();
  });
  // if (!isSingleSlide) {
  //   bindEvents(block);
  // }
}
