import { moveInstrumentation } from '../../scripts/scripts.js';
import { whenElementReady, throttle } from '../../utils/carousel-common.js';

let carouselTimer;
let carouselInterval;
let isInitializing = true; // 初始化锁

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  const indicators = block.querySelectorAll('.carousel-item-indicator');
  block.dataset.slideIndex = slideIndex;
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', true);
    }
  });
}

function showSlide(block, targetLogicalIndex, init = false) {
  const nav = document.querySelector('#navigation');
  const carouselHeight = block.offsetHeight;
  const carouselContainer = block.querySelector('.carousel-items-container');
  const slides = block.querySelectorAll('.carousel-item');
  // 处理homepage高度为100dvh，不影响author，不影响PLP
  if (block.attributes['data-aue-resource'] === undefined && !block.classList.value.includes('only-picture')) {
    carouselContainer.classList.add('full-screen');
  }
  // 1. 核心映射：逻辑索引 0 (第一张图) 在 DOM 中的物理位置是 slides[1]
  // 所以物理索引 = 逻辑索引 + 1
  let physicalIndex = targetLogicalIndex + 1;

  // 2. 处理边界：如果是从第一张往前拨，或者最后一张往后拨
  let isBoundary = false;
  let jumpIndex = -1;

  if (targetLogicalIndex < 0) {
    // 用户想看“上一张”，且当前已是第一张 -> 移动到物理索引 0 (克隆的最后一张)
    physicalIndex = 0;
    isBoundary = true;
    jumpIndex = slides.length - 2; // 动画结束后瞬移回物理索引 3
  } else if (targetLogicalIndex >= slides.length - 2) {
    // 用户想看“下一张”，且当前已是最后一张 -> 移动到物理索引 4 (克隆的第一张)
    physicalIndex = slides.length - 1;
    isBoundary = true;
    jumpIndex = 1; // 动画结束后瞬移回物理索引 1
  }
  const targetSlide = slides[physicalIndex];
  // 处理和navigation的联动
  if (targetSlide.classList.contains('dark')) {
    block.classList.add('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) nav.classList.add('header-dark-mode');
  } else {
    block.classList.remove('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) nav.classList.remove('header-dark-mode');
  }
  // 3. 执行平滑滚动
  carouselContainer.scrollTo({
    left: targetSlide.offsetLeft,
    behavior: init ? 'instant' : 'smooth',
  });

  if (init) {
    updateActiveSlide(targetSlide);
    return;
  }
  // 4. 如果触碰了边界，等动画结束后“瞬移”回真实位置
  if (isBoundary) {
    // 清除之前的定时器防止冲突
    if (carouselTimer) clearTimeout(carouselTimer);

    carouselTimer = setTimeout(() => {
      carouselContainer.scrollTo({
        left: slides[jumpIndex].offsetLeft,
        behavior: 'instant', // 瞬间跳转，用户无感知
      });
    }, 800);
  }
}
function stopAutoPlay() {
  clearInterval(carouselInterval);
  carouselInterval = null;
}

function autoPlay(block) {
  // 清除可能存在的旧定时器，避免叠加
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    const currentIndex = parseInt(block.dataset.slideIndex, 10) || 0;
    const nextIndex = currentIndex + 1;
    showSlide(block, nextIndex);
    isInitializing = false;
  }, 5000);
}

function observeMouse(block) {
  if (block.attributes['data-aue-resource']) return;
  autoPlay(block);
  block.addEventListener('mouseenter', stopAutoPlay);
  block.addEventListener('mouseleave', () => {
    autoPlay(block);
  });
}
function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-item-indicators');
  if (!slideIndicators) return;
  const slideObserver = new IntersectionObserver((entries) => {
    if (isInitializing) return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-item').forEach((slide) => {
    slideObserver.observe(slide);
  });
  // -----arrow function
  block.querySelector('.slide-prev').addEventListener('click', throttle(() => {
    showSlide(block, parseInt(block.dataset.slideIndex, 10) - 1);
    isInitializing = false;
  }, 1000));
  block.querySelector('.slide-next').addEventListener('click', throttle(() => {
    showSlide(block, parseInt(block.dataset.slideIndex, 10) + 1);
    isInitializing = false;
  }, 1000));
  // ----- indicator function
  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', throttle((e) => {
      isInitializing = false;
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    }, 500));
  });
  observeMouse(block);
}

function createSlide(block, row, slideIndex) {
  const slide = document.createElement('li');
  const div = document.createElement('div');
  div.setAttribute('class', 'carousel-content h-grid-container');
  moveInstrumentation(row, slide);
  const buttonDiv = document.createElement('div');
  buttonDiv.setAttribute('class', 'carousel-cta-container');
  moveInstrumentation(row, slide);
  slide.classList.add('carousel-item');
  slide.dataset.slideIndex = slideIndex;
  [...row.children].forEach((column, colIdx) => {
    let theme;
    let contentType; // true is svg mode; false is text mode
    // let pcImg;
    // let mobileImg;
    let buttonTheme;
    switch (colIdx) {
      case 0:
        // container-reference div
        column.classList.add('carousel-item-image');
        // 处理image-theme联动nav
        theme = [...column.children][2]?.innerHTML || 'false';
        slide.classList.add(theme === 'true' ? 'dark' : 'light');
        column.lastElementChild.remove();
        break;
      case 1:
        // container-text or svg switch div
        contentType = column.querySelector('p')?.innerHTML || 'false';
        column.innerHTML = '';
        break;
      case 2:
        // colorful text div
        column.classList.add('teal-text');
        break;
      case 3:
        // richtext div
        column.setAttribute('class', 'carousel-item-content text-content');
        break;
      case 4:
        // icon-svg div
        column.setAttribute('class', 'carousel-item-content icon-svg');
        break;
      default:
        column.classList.add('carousel-item-cta');
        buttonTheme = column.firstElementChild?.innerHTML || 'transparent';
        column.querySelector('a')?.classList.add(buttonTheme);
        column.firstElementChild?.remove();
    }

    if (column.innerHTML === '') return;
    if ([2, 3, 4].includes(colIdx)) {
      // 处理svg模式下没有清除文字的情况 ---- 若两者都要再处理
      if (contentType === 'true' && column.querySelector('teal-text')) {
        column.style.display = 'none';
      }
      if (contentType === 'true' && column.querySelector('text-content')) {
        column.style.display = 'none';
      }
      // 处理文字和icon是一个container
      div.append(column);
    } else if ([5, 6].includes(colIdx)) {
      // 处理button
      buttonDiv.append(column);
    } else slide.append(column);
  });
  div.append(buttonDiv);
  slide.append(div);
  return slide;
}

export default async function decorate(block) {
  const isSingleSlide = [...block.children].length < 2;
  const wholeContainer = document.createElement('ul');
  wholeContainer.classList.add('carousel-items-container');
  let slideIndicators;
  if (!isSingleSlide) {
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-item-indicators');
  }
  [...block.children].forEach((row, idx) => {
    const slide = createSlide(block, row, idx);
    wholeContainer.append(slide);
    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-item-indicator');
      indicator.dataset.targetSlide = String(idx);
      indicator.innerHTML = `
        <button type="button" class="indicator-button"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });
  block.prepend(wholeContainer);
  // 处理轮播无缝衔接；不影响author
  if (!isSingleSlide && block.attributes['data-aue-resource'] === undefined) {
    const cloneFirstNode = wholeContainer.firstElementChild.cloneNode(true);
    const cloneLastNode = wholeContainer.lastElementChild.cloneNode(true);
    wholeContainer.prepend(cloneLastNode);
    wholeContainer.appendChild(cloneFirstNode);
  }
  if (slideIndicators) {
    block.append(slideIndicators);
    // 处理左右箭头---未定版(mobile不要)
    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;
    block.append(slideNavButtons);
  }
  if (!isSingleSlide) {
    bindEvents(block);
  }
  // 初始化加载主题色
  whenElementReady('.carousel-items-container', () => {
    showSlide(block, 0, true);
  });
}
