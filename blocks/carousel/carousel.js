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
function createSlide(row, slideIndex) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-item-${slideIndex}`);
  slide.classList.add('carousel-item');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-item-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  // const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  // if (labeledBy) {
  //   slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  // }

  return slide;
}

export default async function decorate(block) {
  // carousel block
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const slidesContainer = document.createElement('div');
  slidesContainer.classList.add('slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('slides-wrapper');
  block.prepend(slidesWrapper);

  // more than 2 image to create indicators & nav controls
  let slideControls;
  if (!isSingleSlide) {
    const slideNav = document.createElement('nav');
    slideNav.classList.add('slide-navigation');
    slideControls = document.createElement('ol');
    slideControls.classList.add('carousel-controls');
    slideNav.append(slideControls);
    block.append(slideNav);

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
    const slide = createSlide(row, idx);
    slidesWrapper.append(slide);

    if (slideControls) {
      const indicatorItem = document.createElement('li');
      indicatorItem.classList.add('carousel-item-indicator');
      indicatorItem.dataset.targetSlide = idx;
      indicatorItem.innerHTML = `<button type="button" aria-label="'Show Slide' ${idx + 1} 'of' ${rows.length}" class="indicator-button"></button>`;
      slideControls.append(indicatorItem);
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
