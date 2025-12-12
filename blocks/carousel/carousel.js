// update current carouselItem and relative indicators
// function updateActiveSlide(slide) {
//   const block = slide.closest('.carousel');
//   const slideIndex = parseInt(slide.dataset.slideIndex, 10);
//   block.dataset.activeSlide = String(slideIndex);
//
//   const slides = block.querySelectorAll('.carousel-item');
//
//   slides.forEach((aSlide, idx) => {
//     aSlide.setAttribute('aria-hidden', idx !== slideIndex);
//     aSlide.querySelectorAll('a').forEach((link) => {
//       if (idx !== slideIndex) {
//         link.setAttribute('tabindex', '-1');
//       } else {
//         link.removeAttribute('tabindex');
//       }
//     });
//   });
//
//   const carouselIndicators = block.querySelectorAll('.carousel-item-indicator');
//   carouselIndicators.forEach((indicator, idx) => {
//     const carouselButton = indicator.querySelector('button');
//     if (idx !== slideIndex) {
//       carouselButton.removeAttribute('disabled');
//       carouselButton.removeAttribute('aria-current');
//     } else {
//       carouselButton.setAttribute('disabled', true);
//       carouselButton.setAttribute('aria-current', true);
//     }
//   });
// }

// scroll to current carouselItem
// function showSlide(block, slideIndex = 0) {
//   const slides = block.querySelectorAll('.carousel-item');
//   let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
//   if (slideIndex >= slides.length) realSlideIndex = 0;
//   const activeSlide = slides[realSlideIndex];
//
//   activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
//   block.querySelector('.carousel-items').scrollTo({
//     top: 0,
//     left: activeSlide.offsetLeft,
//     behavior: 'smooth',
//   });
// }

// indicators event
// function bindEvents(block) {
//   const slideIndicators = block.querySelector('.carousel-item-indicators');
//   if (!slideIndicators) return;
//
//   slideIndicators.querySelectorAll('button').forEach((button) => {
//     button.addEventListener('click', (e) => {
//       const slideIndicator = e.currentTarget.parentElement;
//       showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
//     });
//   });
//
//   block.querySelector('.slide-prev').addEventListener('click', () => {
//     showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
//   });
//   block.querySelector('.slide-next').addEventListener('click', () => {
//     showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
//   });
//
//   const slideObserver = new IntersectionObserver((entries) => {
//     entries.forEach((entry) => {
//       if (entry.isIntersecting) updateActiveSlide(entry.target);
//     });
//   }, { threshold: 0.5 });
//   block.querySelectorAll('.carousel-item').forEach((slide) => {
//     slideObserver.observe(slide);
//   });
// }

// ctaButton Event
// function bindButtonEvents(block) {
//   const carouselButtons = block.querySelectorAll('.carousel-item');
//   carouselButtons.forEach((buttonNode) => {
//     const defaultButton = buttonNode.querySelectorAll('.button');
//     const activeButton = defaultButton[0];
//     activeButton.classList.add('active');
//   });
// }

// creat carousel item
function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-item-${slideIndex}`);
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

let carouselId = 0;

export default async function decorate(block) {
  carouselId += 1;
  // carousel block
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;
  // cta-content has a className
  // const ctaButtons = block.querySelectorAll('.button');

  const slidesContainer = document.createElement('div');
  slidesContainer.classList.add('carousel-items-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-items');
  block.prepend(slidesWrapper);

  // more than 2 image to create indicators & nav controls
  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Indicators');
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

    slidesContainer.append(slideNavButtons);
  }
  // creat indicator box
  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicatorItem = document.createElement('li');
      indicatorItem.classList.add('carousel-item-indicator');
      indicatorItem.dataset.targetSlide = idx;
      indicatorItem.innerHTML = `<button type="button" aria-label="'Show Slide' ${idx + 1} 'of' ${rows.length}" class="indicator-button"></button>`;
      slideIndicators.append(indicatorItem);
    }
    row.remove();
  });

  slidesContainer.append(slidesWrapper);
  block.prepend(slidesContainer);

  // if (!isSingleSlide) {
  //   bindEvents(block);
  // }
  // if (ctaButtons.length > 0) {
  //   bindButtonEvents(block);
  // }
}
