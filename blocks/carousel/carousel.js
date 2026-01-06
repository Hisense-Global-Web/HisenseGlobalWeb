import { moveInstrumentation } from '../../scripts/scripts.js';
import { whenElementReady, throttle } from '../../utils/carousel-common.js';

// let carouselTimer;
let carouselInterval;
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

function showSlide(block, slideIndex, init = false) {
  const slides = block.querySelectorAll('.carousel-item');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];
  const nav = document.querySelector('#navigation');
  const carouselHeight = block.offsetHeight;
  if (block.attributes['data-aue-resource'] === undefined) {
    const specialDiv = block.querySelector('.carousel-items-container');
    specialDiv.style.setProperty('height', '100dvh', 'important');
  }
  if ([...activeSlide.classList].includes('dark')) {
    block.classList.add('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) document.querySelector('#navigation').classList.add('header-dark-mode');
  } else {
    block.classList.remove('dark');
    if (nav && (block.getBoundingClientRect().top > -carouselHeight)) document.querySelector('#navigation').classList.remove('header-dark-mode');
  }
  if (init) return;
  if (realSlideIndex === 0 && block.attributes['data-aue-resource'] === undefined) {
    // 1. 先平滑滚动到“克隆的第一张”
    block.querySelector('.carousel-items-container').scrollTo({
      left: slides[slides.length - 1].offsetLeft,
      behavior: 'smooth',
    });

    // 2. 监听滚动结束（或者估算动画时间）
    setTimeout(() => {
      // 3. 瞬间切换回真正的第一张，关闭动画！
      block.querySelector('.carousel-items-container').scrollTo({
        left: activeSlide.offsetLeft,
        behavior: 'instant', // 关键：无感知跳转
      });
    }, 1000);
  } else {
    block.querySelector('.carousel-items-container').scrollTo({
      top: 0,
      left: activeSlide.offsetLeft,
      behavior: 'smooth',
    });
  }
}
function stopAutoPlay() {
  clearInterval(carouselInterval);
  carouselInterval = null;
  // carouselTimer = null;
}

function autoPlay(block) {
  let currentIndex = block.dataset.slideIndex || 0;
  const images = block.querySelectorAll('.carousel-item');
  carouselInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % (images.length - 1);
    showSlide(block, currentIndex);
  }, 3000);
}

function observeMouse(block) {
  if (block.attributes['data-aue-resource']) return;
  // if (carouselTimer) { stopAutoPlay(); return; }
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
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-item').forEach((slide) => {
    slideObserver.observe(slide);
  });
  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', throttle((e) => {
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
  slide.classList.add('carousel-item');
  slide.dataset.slideIndex = slideIndex;
  [...row.children].forEach((column, colIdx) => {
    let theme;
    let imageLinkHref;
    switch (colIdx) {
      case 0:
        column.classList.add('carousel-item-image');
        imageLinkHref = column.querySelector('a')?.href || column.querySelectorAll('p')[1]?.textContent;
        if (imageLinkHref) {
          column.addEventListener('click', () => {
            window.location.href = imageLinkHref;
          });
        }
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
  if (slideIndicators && block.attributes['data-aue-resource'] === undefined) {
    const cloneFirstNode = wholeContainer.firstElementChild.cloneNode(true);
    wholeContainer.appendChild(cloneFirstNode);
  }
  if (slideIndicators) block.append(slideIndicators);
  if (!isSingleSlide) {
    bindEvents(block);
  }
  // 初始化加载主题色
  whenElementReady('.carousel', () => {
    showSlide(block, 0, true);
  });
}
