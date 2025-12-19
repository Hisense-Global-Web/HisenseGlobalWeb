import { moveInstrumentation } from '../../scripts/scripts.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  const indicators = block.querySelectorAll('.carousel-item-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
    } else {
      button.setAttribute('disabled', true);
    }
  });
}

function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-item');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];
  const nav = document.querySelector('#navigation');
  if ([...activeSlide.classList].includes('dark')) {
    block.classList.add('dark');
    if (nav) document.querySelector('#navigation').classList.add('header-dark-mode');
  } else {
    block.classList.remove('dark');
    if (nav) document.querySelector('#navigation').classList.remove('header-dark-mode');
  }
  block.querySelector('.carousel-items-container').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'instant',
  });
}

function observeMouse(block, index) {
  let currentIndex = index;
  const images = block.querySelectorAll('.carousel-item');
  let timer;
  if (block.hasAttribute('data-aue-resource')) return;
  const autoPlay = () => {
    timer = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      showSlide(block, currentIndex);
    }, 3000);
  };
  block.addEventListener('mouseenter', () => {
    clearInterval(timer);
    timer = null;
  });
  block.addEventListener('mouseleave', () => {
    autoPlay();
  });
  if (block.classList.contains('only-picture')) {
    images.forEach((image) => {
      const link = image.querySelector('a');
      const url = link?.href;
      image.addEventListener('click', () => {
        if (url) window.location.href = url;
      });
    });
  }
  autoPlay();
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
}
function createSlide(block, row, slideIndex) {
  const slide = document.createElement('li');
  const div = document.createElement('div');
  div.setAttribute('class', 'carousel-content');
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
          column.firstElementChild.classList.add('teal-text');
          column.lastElementChild.classList.add('change-text');
        }
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
  observeMouse(block, 0);
}
