import { moveInstrumentation } from '../../scripts/scripts.js';
// import { createOptimizedPicture } from '../../scripts/aem.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-item');
  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-item-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx !== slideIndex) {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-current');
    } else {
      button.setAttribute('disabled', true);
      button.setAttribute('aria-current', true);
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-item');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];
  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-items-container').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
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

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });
}
function createSlide(row, slideIndex) {
  const slide = document.createElement('li');
  moveInstrumentation(row, slide);
  slide.classList.add('carousel-item');
  slide.dataset.slideIndex = slideIndex;
  [...row.children].forEach((column, colIdx) => {
    if (colIdx === 0) column.classList.add('carousel-item-image');
    else if (colIdx === 1) column.classList.add('carousel-item-content');
    else column.classList.add('carousel-item-cta');
    slide.append(column);
  });
  return slide;
}
export default async function decorate(block) {
  const isSingleSlide = [...block.children].length < 2;
  const wholeContainer = document.createElement('ul');
  wholeContainer.classList.add('carousel-items-container');
  let slideIndicators;
  let slideNavButtons;
  let slideIndicatorsNav;
  if (!isSingleSlide) {
    slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.classList.add('indicators');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-item-indicators');
    slideIndicatorsNav.append(slideIndicators);
    slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="'Previous Slide'"></button>
      <button type="button" class="slide-next" aria-label="'Next Slide'"></button>
    `;
  }
  [...block.children].forEach((row, idx) => {
    const slide = createSlide(row, idx);
    wholeContainer.append(slide);
    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-item-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `
        <button type="button" class="indicator-button"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });
  block.prepend(wholeContainer);
  block.append(slideIndicatorsNav);
  block.append(slideNavButtons);
  if (!isSingleSlide) {
    bindEvents(block);
  }
}
