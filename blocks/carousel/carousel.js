import { moveInstrumentation } from '../../scripts/scripts.js';

let carouselTimer;
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

function whenElementReady(selector, callback, options = {}) {
  const {
    timeout = 5000,
    parent = document,
    stopAfterFound = true,
  } = options;

  const element = parent.querySelector(selector);
  if (element) {
    setTimeout(() => callback(element), 0);
    return { stop: () => {} };
  }

  let observer;
  let timeoutId;

  const cleanup = () => {
    if (observer) observer.disconnect();
    if (timeoutId) clearTimeout(timeoutId);
  };

  // Setup timeout
  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      cleanup();
    }, timeout);
  }

  // Setup MutationObserver
  observer = new MutationObserver((mutations) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'subtree') {
        const foundElement = parent.querySelector(selector);
        if (foundElement) {
          cleanup();
          callback(foundElement);
          if (stopAfterFound) break;
        }
      }
    }
  });

  // Start observing
  observer.observe(parent, {
    childList: true,
    subtree: true,
  });

  return { stop: cleanup };
}

function showSlide(block, slideIndex, init = false) {
  const slides = block.querySelectorAll('.carousel-item');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];
  const nav = document.querySelector('#navigation');
  const carouselHeight = block.offsetHeight;

  if ([...activeSlide.classList].includes('dark')) {
    block.classList.add('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) document.querySelector('#navigation').classList.add('header-dark-mode');
  } else {
    block.classList.remove('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) document.querySelector('#navigation').classList.remove('header-dark-mode');
  }
  if (init) return;
  block.querySelector('.carousel-items-container').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}
function stopAutoPlay() {
  clearInterval(carouselTimer);
  carouselTimer = null;
}

function autoPlay(block, index) {
  let currentIndex = index;
  const images = block.querySelectorAll('.carousel-item');
  carouselTimer = setInterval(() => {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(block, currentIndex);
  }, 3000);
}

function observeMouse(block, index) {
  if (document.getElementById('editor-app')) return;
  autoPlay(block, index);
  block.addEventListener('mouseenter', stopAutoPlay);
  block.addEventListener('mouseleave', () => {
    autoPlay(block, index);
  });
}
function touchEvent(block) {
  let startX;
  let prevX;
  let X;
  block.addEventListener('touchstart', (e) => {
    e.preventDefault();
    stopAutoPlay();
    startX = e.changedTouches[0].pageX;
  });
  block.addEventListener('touchmove', (e) => {
    e.preventDefault();
    stopAutoPlay();
    const moveEndX = e.changedTouches[0].pageX;
    X = moveEndX - startX;
  });
  block.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (prevX === X) {
      if (e.target.className.includes('button')) {
        e.target.click();
        return;
      }
    }
    if (X > 0) {
      // 左滑
      showSlide(block, parseInt(Number(block.dataset.slideIndex) - 1, 10));
    } else if (X < 0) {
      // 右滑
      showSlide(block, parseInt(Number(block.dataset.slideIndex) + 1, 10));
    }
    prevX = X;
    autoPlay(block, block.dataset.slideIndex);
  });
}
function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-item-indicators');
  if (!slideIndicators) return;
  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-item').forEach((slide) => {
    slideObserver.observe(slide);
  });
  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });
  observeMouse(block, 0);
  touchEvent(block);
}
function createSlide(block, row, slideIndex) {
  const slide = document.createElement('li');
  const div = document.createElement('div');
  div.setAttribute('class', 'carousel-content h-grid-container');
  moveInstrumentation(row, slide);
  slide.classList.add('carousel-item');
  slide.dataset.slideIndex = slideIndex;
  [...row.children].forEach((column, colIdx) => {
    let theme;
    switch (colIdx) {
      case 0:
        column.classList.add('carousel-item-image');
        break;
      case 1:
        column.classList.add('carousel-item-theme');
        theme = column.querySelector('p')?.innerHTML || 'false';
        slide.classList.add(theme === 'true' ? 'dark' : 'light');
        column.innerHTML = '';
        break;
      case 2:
        column.classList.add('carousel-item-content');
        if ([...column.children].length > 1) {
          if ([...column.children][0].nodeName === 'P') column.firstElementChild.classList.add('teal-text');
          column.lastElementChild.classList.add('change-text');
        }
        [...column.children].forEach((children) => {
          if (children.innerHTML.includes('/n')) children.classList.add('focus-wrap');
        });
        break;
      default:
        column.classList.add('carousel-item-cta');
    }
    if (column.innerHTML === '') return;
    if ([2, 3].includes(colIdx)) {
      div.appendChild(column);
    } else {
      slide.append(column);
    }
  });
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
    const ctaContent = slide.querySelector('.button');
    if (ctaContent) {
      ctaContent.classList.add('active');
    }
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
  if (slideIndicators) block.append(slideIndicators);
  if (!isSingleSlide) {
    bindEvents(block);
  }
  // 初始化加载主题色
  whenElementReady('.carousel', () => {
    showSlide(block, 0, true);
  });
}
