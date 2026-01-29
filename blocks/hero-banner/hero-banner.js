import { moveInstrumentation } from '../../scripts/scripts.js';
import { whenElementReady, throttle } from '../../utils/carousel-common.js';
import { createElement } from '../../utils/dom-helper.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';

let heroBannerTimer;
let heroBannerInterval;
let isInitializing = true; // 初始化锁

function updateNavTheme(block, targetSlide, heroBannerHeight) {
  const nav = document.querySelector('#navigation');
  if (!nav) {
    // 如果 nav 不存在，延迟 200ms 重试
    setTimeout(() => {
      updateNavTheme(block, targetSlide, heroBannerHeight);
    }, 200);
    return;
  }

  if (targetSlide.classList.contains('dark')) {
    block.classList.add('dark');
    if (block.getBoundingClientRect().top > -heroBannerHeight) {
      nav.classList.add('header-dark-mode');
    }
  } else {
    block.classList.remove('dark');
    if (block.getBoundingClientRect().top > -heroBannerHeight) {
      nav.classList.remove('header-dark-mode');
    }
  }
}

function updateActiveSlide(block, slide) {
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  const indicators = block.querySelectorAll('.hero-banner-item-indicator');
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
  const heroBannerHeight = block.offsetHeight;
  const heroBannerContainer = block.querySelector('.hero-banner-items-container');
  const slides = block.querySelectorAll('.hero-banner-item');
  // 处理homepage高度100dvh，不影响author，不影响PLP
  if (block.attributes['data-aue-resource'] === undefined && !block.classList.value.includes('only-picture')) {
    heroBannerContainer.classList.add('full-screen');
  }
  // 1. 核心映射：逻辑索引 0 (第一张图) 到DOM 中的物理位置是slides[1]
  // 所以物理索引 = 逻辑索引 + 1
  let physicalIndex = targetLogicalIndex + 1;

  // 2. 处理边界：如果是从第一张往前拨，或者最后一张往后拨
  let isBoundary = false;
  let jumpIndex = -1;

  if (targetLogicalIndex < 0) {
    // 用户想看"上一张"，且当前已是第一张-> 移动到物理索引0 (克隆的最后一张)
    physicalIndex = 0;
    isBoundary = true;
    jumpIndex = slides.length - 2; // 动画结束后瞬移回物理索引 3
  } else if (targetLogicalIndex >= slides.length - 2) {
    // 用户想看"下一张"，且当前已是最后一张-> 移动到物理索引4 (克隆的第一张)
    physicalIndex = slides.length - 1;
    isBoundary = true;
    jumpIndex = 1; // 动画结束后瞬移回物理索引 1
  }
  const targetSlide = slides[physicalIndex];
  // 处理和navigation的联动
  updateNavTheme(block, targetSlide, heroBannerHeight);
  // 3. 执行平滑滚动
  heroBannerContainer.scrollTo({
    left: targetSlide.offsetLeft,
    behavior: init ? 'instant' : 'smooth',
  });
  updateActiveSlide(block, targetSlide);
  if (init) return;
  // 4. 如果触碰了边界，等动画结束后“瞬移”回真实位置
  if (isBoundary) {
    // 清除之前的定时器防止冲突
    if (heroBannerTimer) clearTimeout(heroBannerTimer);

    heroBannerTimer = setTimeout(() => {
      heroBannerContainer.scrollTo({
        left: slides[jumpIndex].offsetLeft,
        behavior: 'instant', // 瞬间跳转，用户无感知
      });
      if (slides[jumpIndex].querySelector('video') && slides[jumpIndex].querySelector('.video-play-icon').classList.contains('is-paused')) {
        slides[jumpIndex].querySelector('.video-play-icon').click();
      }
    }, 800);
  } else if (targetSlide.querySelector('video')
    && targetSlide.querySelector('.video-play-icon').classList.contains('is-paused')
  ) {
    // 5. if slide contains video, auto play the video
    targetSlide.querySelector('.video-play-icon').click();
  }
}
function stopAutoPlay() {
  clearInterval(heroBannerInterval);
  heroBannerInterval = null;
}

function autoPlay(block) {
  // 清除可能存在的旧定时器，避免叠加
  if (heroBannerInterval) clearInterval(heroBannerInterval);
  heroBannerInterval = setInterval(() => {
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
  const slideIndicators = block.querySelector('.hero-banner-item-indicators');
  if (!slideIndicators) return;
  const slideObserver = new IntersectionObserver((entries) => {
    if (isInitializing) return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(block, entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.hero-banner-item').forEach((slide) => {
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
  // ----- mouse observe
  observeMouse(block);
}

function initVideo(selector, type) {
  let videoUrl;
  let link;
  const [videoPC, videoMobile] = [...selector.querySelectorAll('a')];
  if (type === 'desktop') link = videoPC;
  else link = videoMobile;
  if (link) videoUrl = link.href;
  const videoDivDom = createElement('div', 'video-div-box');
  const video = createElement('video', 'video-auto-play');
  const span = createElement('span', 'video-play-icon is-playing');
  video.loop = true;
  video.preload = 'auto';
  video.autoplay = true;
  const source = document.createElement('source');
  source.src = videoUrl;
  source.type = 'video/mp4';
  video.muted = true;
  video.playsInline = true;
  video.appendChild(source);
  videoDivDom.appendChild(video);
  videoDivDom.appendChild(span);
  return videoDivDom;
}

function createSlide(block, row, slideIndex) {
  const slide = createElement('li', 'hero-banner-item');
  const div = createElement('div', 'hero-banner-content h-grid-container');
  moveInstrumentation(row, slide);
  const buttonDiv = createElement('div', 'hero-banner-cta-container');
  const textContent = createElement('div', 'text-content');
  slide.dataset.slideIndex = slideIndex;
  [...row.children].forEach((column, colIdx) => {
    let theme;
    let contentType; // true is svg mode; false is text mode
    let buttonTheme;
    let videoElement;
    let videoDom;
    switch (colIdx) {
      case 0:
        // container-reference div
        column.classList.add('hero-banner-item-image');
        // 处理image-theme联动nav
        if (column.lastElementChild?.innerHTML.length === 4) {
          theme = column.lastElementChild?.innerHTML || 'false';
          column.lastElementChild?.remove();
        } else theme = 'false';
        slide.classList.add(theme === 'true' ? 'dark' : 'light');
        if (column.querySelector('a')) {
          // video mode
          column.classList.add('video-mode');
          videoElement = initVideo(column, 'desktop');
          videoDom = column.querySelectorAll('a')[0]?.closest('p');
          if (window.innerWidth <= 860) {
            // mobile video
            videoElement = initVideo(column, 'mobile');
            videoDom = column.querySelectorAll('a')[1]?.closest('p');
          }
          if (videoDom) column.replaceChild(videoElement, videoDom);
        }
        break;
      case 1:
        // container-text or svg switch div
        contentType = column.querySelector('p')?.innerHTML || 'false';
        column.innerHTML = '';
        break;
      case 2:
        // colorful text div
        column.classList.add('teal-text');
        textContent.append(column);
        break;
      case 3:
        // richtext div
        column.setAttribute('class', 'hero-banner-item-content');
        textContent.append(column);
        break;
      case 4:
        // icon-svg div
        column.setAttribute('class', 'hero-banner-item-content icon-svg');
        break;
      default:
        column.classList.add('hero-banner-item-cta');
        buttonTheme = column.firstElementChild?.innerHTML || 'transparent';
        column.querySelector('a')?.classList.add(buttonTheme);
        if (column.firstElementChild?.innerHTML.length <= 13) column.firstElementChild?.remove();
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
      if (colIdx === 4) div.append(column);
      else div.append(textContent);
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
  const wholeContainer = createElement('ul', 'hero-banner-items-container');
  let slideIndicators;
  if (!isSingleSlide) {
    slideIndicators = createElement('ol', 'hero-banner-item-indicators');
  }
  [...block.children].forEach((row, idx) => {
    const slide = createSlide(block, row, idx);
    wholeContainer.append(slide);
    if (slideIndicators) {
      const indicator = createElement('li', 'hero-banner-item-indicator');
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
    // 处理左右箭头(mobile不要)
    const slideNavButtons = createElement('div', 'hero-banner-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;
    block.append(slideNavButtons);
  }
  // 初始化加载主题色
  whenElementReady('.hero-banner-items-container', () => {
    showSlide(block, 0, true);
  });
  if (isUniversalEditor()) return;
  if (!isSingleSlide) {
    bindEvents(block);
  }
  // ----- autoplay function for Video
  if (!block.querySelector('video')) return;
  const videos = block.querySelectorAll('.video-mode');
  videos.forEach((video) => {
    video.querySelector('.video-play-icon').addEventListener('click', throttle((e) => {
      if (e.target.classList.contains('is-playing')) {
        e.target.classList.remove('is-playing');
        e.target.classList.add('is-paused');
        e.target.closest('li').querySelector('video')?.pause();
      } else {
        e.target.classList.remove('is-paused');
        e.target.classList.add('is-playing');
        e.target.closest('li').querySelector('video')?.play();
      }
    }, 300));
  });
  const VideoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const v = entry.target;
      const currentSlideIdx = parseInt(v.dataset.slideIndex, 10) || 0;
      const currentSlide = block.querySelector(`.hero-banner-item[data-slide-index="${currentSlideIdx}"]`);
      if (entry.intersectionRatio === 0) {
        if (currentSlide && currentSlide.querySelector('.video-play-icon')?.classList.contains('is-playing')) {
          currentSlide.querySelector('.video-play-icon').classList.remove('is-playing');
          currentSlide.querySelector('.video-play-icon').classList.add('is-paused');
          currentSlide.querySelector('video')?.pause();
        }
      }
    });
  }, {
    threshold: 0,
  });
  VideoObserver.observe(block);
}
