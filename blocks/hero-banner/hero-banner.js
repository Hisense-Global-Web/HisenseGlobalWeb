import { moveInstrumentation } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { whenElementReady, throttle } from '../../utils/carousel-common.js';
import { createElement } from '../../utils/dom-helper.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';
import { toDynamicMediaVideoUrl } from '../../utils/dynamic-media.js';
import { setVideoSource } from '../../utils/hls-video.js';
import { isVideoMediaColumn, normalizeImageReferenceLinks } from './media-reference.js';
import { SCREEN_POINT } from '../../utils/constants.js';
import { iframeVideoHandler, resetExternalUrl } from '../../utils/video-external-url.js';

let heroBannerTimer;
let heroBannerInterval;
// flag to indicate user is currently interacting with the carousel
let userInteracting = false;
let isInitializing = true; // 初始化锁
const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';
const HERO_BANNER_BLOCK_CONFIG_KEYS = new Set([
  'classes',
]);
const HERO_BANNER_LEGACY_BLOCK_CONFIG_KEYS = new Set([
  'dynamic-media',
]);

function normalizeConfigKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCellText(cell) {
  return cell?.textContent?.trim?.() || '';
}

function isTruthy(value) {
  return ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function isHeroBannerConfigRow(row) {
  const cells = [...(row?.children || [])];
  if (cells.length !== 2) return false;

  const configKey = normalizeConfigKey(cells[0].textContent);
  return HERO_BANNER_BLOCK_CONFIG_KEYS.has(configKey)
    || HERO_BANNER_LEGACY_BLOCK_CONFIG_KEYS.has(configKey);
}

function readHeroBannerConfig(rows) {
  return rows.reduce((config, row) => {
    if (!isHeroBannerConfigRow(row)) return config;

    const cells = [...row.children];
    config[normalizeConfigKey(cells[0].textContent)] = getCellText(cells[1]);
    return config;
  }, {});
}

function getColumnConfigKey(column) {
  const prop = column?.getAttribute?.('data-aue-prop')
    || column?.querySelector?.('[data-aue-prop]')?.getAttribute?.('data-aue-prop')
    || column?.dataset?.aueProp;

  return normalizeConfigKey(prop);
}

function isHeroBannerItemDynamicMediaColumn(column, index, columns) {
  if (getColumnConfigKey(column) === 'dynamic-media') return true;

  return columns.length > 7 && index === 1;
}

function isHeroBannerItemMobileImageColumn(column, index, columns) {
  if (getColumnConfigKey(column) === 'image-mobile') return true;

  return columns.length > 8 && index === 2;
}

function getHeroBannerItemDynamicMedia(row) {
  const columns = [...(row?.children || [])];
  const dynamicMediaColumn = columns.find((column, index) => (
    isHeroBannerItemDynamicMediaColumn(column, index, columns)
  ));

  return dynamicMediaColumn ? isTruthy(getCellText(dynamicMediaColumn)) : undefined;
}

function getHeroBannerItemMobileImageColumn(row) {
  const columns = [...(row?.children || [])];

  return columns.find((column, index) => (
    isHeroBannerItemMobileImageColumn(column, index, columns)
  ));
}

function getHeroBannerRenderableColumns(row) {
  const columns = [...(row?.children || [])];

  return columns.filter((column, index) => (
    !isHeroBannerItemDynamicMediaColumn(column, index, columns)
    && !isHeroBannerItemMobileImageColumn(column, index, columns)
  ));
}

function appendHeroBannerMobileImageColumn(imageColumn, mobileImageColumn) {
  if (!imageColumn || !mobileImageColumn?.children?.length) return;

  const mobileImageContent = mobileImageColumn.firstElementChild;
  if (mobileImageContent) {
    moveInstrumentation(mobileImageColumn, mobileImageContent);
  }

  while (mobileImageColumn.firstChild) {
    imageColumn.append(mobileImageColumn.firstChild);
  }
}

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
  // 4. 如果触碰了边界，等动画结束后"瞬移"回真实位置
  if (isBoundary) {
    // 清除之前的定时器防止冲突
    if (heroBannerTimer) clearTimeout(heroBannerTimer);

    heroBannerTimer = setTimeout(() => {
      heroBannerContainer.scrollTo({
        left: slides[jumpIndex].offsetLeft,
        behavior: 'instant', // 瞬间跳转，用户无感知
      });
      if (slides[jumpIndex].querySelector('video') && slides[jumpIndex].querySelector('.video-play-icon').classList.contains('is-paused')) {
        slides[jumpIndex].querySelector('.video-play-icon > img').click();
      }
    }, 800);
  } else if (targetSlide.querySelector('video')
    && targetSlide.querySelector('.video-play-icon').classList.contains('is-paused')
  ) {
    // 5. if slide contains video, auto play the video
    targetSlide.querySelector('.video-play-icon > img').click();
  }
  isInitializing = false; // 触发完后解锁初始化
}

function stopAutoPlay() {
  clearInterval(heroBannerInterval);
  heroBannerInterval = null;
}

function autoPlay(block) {
  // 清除可能存在的旧定时器，避免叠加
  if (heroBannerInterval) clearInterval(heroBannerInterval);
  heroBannerInterval = setInterval(() => {
    if (userInteracting) return; // skip while user is manipulating slides
    const currentIndex = parseInt(block.dataset.slideIndex, 10) || 0;
    const nextIndex = currentIndex + 1;
    showSlide(block, nextIndex);
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
  let autoPlayRestartTimer = null;
  const slideObserver = new IntersectionObserver((entries) => {
    if (isInitializing) return;
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(block, entry.target);
    });
  }, { threshold: 0.5 });

  // 遍历每个 slide，独立绑定媒体查询监听
  block.querySelectorAll('.hero-banner-item').forEach((slide) => {
    slideObserver.observe(slide);

    // 媒体查询对象（确认 SCREEN_POINT = 640）
    const mediaBannerItemQuery = window.matchMedia(`(min-width: ${SCREEN_POINT}px)`);

    // 每个 slide 独立的 touch 变量（避免闭包污染）
    let touchStartTime = 0;
    let startX = 0;
    let startY = 0;
    let isScrolling = false;

    // ====== 提取命名函数（支持后续解绑） ======
    function onTouchStart(e) {
      userInteracting = true;
      touchStartTime = Date.now();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isScrolling = false;
      isInitializing = true;
      slide.classList.remove('touch-end');
      slide.classList.add('touch-start');
    }

    function onTouchMove(e) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - startX;
      const diffY = currentY - startY;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
        if (e.cancelable) e.preventDefault();
        isScrolling = true;
      } else {
        isScrolling = false;
      }
    }

    async function onTouchEnd(e) {
      slide.classList.remove('touch-start');
      slide.classList.add('touch-end');
      const touchDuration = Date.now() - touchStartTime;

      // 短触点击：执行链接跳转或视频播放控制
      if (!isScrolling && touchDuration < 500) {
        if (e.target.tagName === 'A' && e.target.href) {
          window.location.href = e.target.href;
          return;
        }
        if (
          e.target.tagName === 'IMG'
          && e.target.parentElement?.classList.contains('video-play-icon')
        ) {
          e.target.click();
          return;
        }
      }

      // 水平滑动：切换 Slide
      if (isScrolling) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = startX - endX;
        const diffY = startY - endY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
          const currentIndex = parseInt(block.dataset.slideIndex, 10) || 0;
          const nextIndex = diffX > 0 ? currentIndex + 1 : currentIndex - 1;
          await showSlide(block, nextIndex);
          autoPlay(block);

          if (autoPlayRestartTimer) clearTimeout(autoPlayRestartTimer);
          autoPlayRestartTimer = setTimeout(() => {
            userInteracting = false;
            autoPlayRestartTimer = null;
          }, 2000);
        }
      }
    }

    // ====== 媒体查询回调：动态绑定/解绑触摸事件 ======
    const handleBannerItemMediaChange = (event) => {
      if (event.matches) {
        // >= SCREEN_POINT：解绑触摸事件，避免内存泄漏 + 防止桌面误触发
        slide.removeEventListener('touchstart', onTouchStart);
        slide.removeEventListener('touchmove', onTouchMove);
        slide.removeEventListener('touchend', onTouchEnd);
      } else {
        // < SCREEN_POINT (如 640px)：绑定触摸事件
        slide.addEventListener('touchstart', onTouchStart, { passive: true });
        slide.addEventListener('touchmove', onTouchMove, { passive: false }); // preventDefault 需 passive: false
        slide.addEventListener('touchend', onTouchEnd, { passive: true });
      }
    };
    // 初始执行 + 注册 change 监听
    handleBannerItemMediaChange(mediaBannerItemQuery);
    mediaBannerItemQuery.addEventListener('change', handleBannerItemMediaChange);
  });

  // ----- arrow function（左右箭头）
  const leftArrow = block.querySelector('.slide-left');
  const rightArrow = block.querySelector('.slide-right');

  if (leftArrow) {
    leftArrow.addEventListener('click', throttle(async () => {
      stopAutoPlay();
      await showSlide(block, parseInt(block.dataset.slideIndex, 10) - 1);
      autoPlay(block);
    }, 1000));
  }

  if (rightArrow) {
    rightArrow.addEventListener('click', throttle(async () => {
      stopAutoPlay();
      await showSlide(block, parseInt(block.dataset.slideIndex, 10) + 1);
      autoPlay(block);
    }, 1000));
  }

  // ----- indicator function
  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', throttle(async (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      stopAutoPlay();
      await showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      autoPlay(block); // 开始自动播放
    }, 500));
  });
  // ----- mouse observe
  observeMouse(block);
}
function createScrollButton(type, direction) {
  // type : arrow or video
  const button = document.createElement('button');
  button.type = 'button';
  button.className = type === 'arrow' ? `slide-${direction}` : 'video-play-icon';
  if (type === 'arrow') {
    button.setAttribute('aria-label', direction === 'left' ? 'slide-left' : 'slide-right');
  } else {
    button.setAttribute('aria-label', direction === 'video-dark' ? 'video-dark' : 'video-light');
  }
  // 创建图片元素
  const img = document.createElement('img');
  if (type === 'arrow') {
    img.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/switch-arrow-left.svg` : `/content/dam/hisense/${country}/common-icons/switch-arrow-right.svg`;
    img.alt = direction === 'left' ? 'slide-left' : 'slide-right';
  } else {
    img.src = direction === 'video-dark' ? `/content/dam/hisense/${country}/common-icons/pause-dark-mode.svg` : `/content/dam/hisense/${country}/common-icons/pause-light-mode.svg`;
    img.alt = direction === 'video-dark' ? 'video-dark' : 'video-light';
    img.className = 'pause-icon';
  }
  button.appendChild(img);
  // 创建图片元素
  if (type === 'video') {
    const imgClick = document.createElement('img');
    imgClick.src = direction === 'video-dark' ? `/content/dam/hisense/${country}/common-icons/play-dark-mode.svg` : `/content/dam/hisense/${country}/common-icons/play-light-mode.svg`;
    imgClick.alt = direction === 'video-dark' ? 'video-dark' : 'video-light';
    imgClick.className = 'play-icon';
    button.appendChild(imgClick);
  }
  return button;
}
function initVideo(selector, type, theme) {
  let videoUrl;
  let link;
  let videoPC;
  let videoMobile;
  selector.querySelectorAll('a').forEach((a, i) => {
    if (i === 0) videoPC = a;
    else videoMobile = a;
  });
  if (type === 'desktop') link = videoPC; else link = videoMobile;
  if (link) videoUrl = toDynamicMediaVideoUrl(link.href);
  const videoDivDom = createElement('div', 'video-div-box');
  const video = createElement('video', 'video-auto-play');
  const themeClass = theme === 'dark' ? 'video-dark' : 'video-light';
  const span = createScrollButton('video', themeClass);
  span.classList.add('is-playing');
  video.loop = true;
  video.preload = 'auto';
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.playsinline = '';
  setVideoSource(video, videoUrl);
  videoDivDom.appendChild(video);
  videoDivDom.appendChild(span);
  return videoDivDom;
}

function createSlide(block, row, slideIndex, options = {}) {
  const slide = createElement('li', 'hero-banner-item');
  const div = createElement('div', 'hero-banner-content h-grid-container');
  moveInstrumentation(row, slide);
  let titleExist = true;
  let contentExist = true;
  let buttonExist = true;
  let isExternal = false;
  let externalVideoUrl = null;
  const buttonDiv = createElement('div', 'hero-banner-cta-container');
  const textContent = createElement('div', 'text-content');
  const itemDynamicMedia = getHeroBannerItemDynamicMedia(row);
  const dynamicMedia = itemDynamicMedia ?? options.dynamicMedia;
  slide.dataset.slideIndex = slideIndex;
  getHeroBannerRenderableColumns(row).forEach((column, colIdx) => {
    let theme;
    let contentType; // true is svg mode; false is text mode
    let buttonTheme;
    let videoElement;
    let videoDom;

    function updateVideoSource(isPc) {
      if (isPc) {
        videoElement = initVideo(column, 'desktop', theme === 'true' ? 'dark' : 'light');
        videoDom = column.querySelectorAll('a')[0]?.closest('p');
      } else {
        videoElement = initVideo(column, 'mobile', theme === 'true' ? 'dark' : 'light');
        videoDom = column.querySelectorAll('a')[1]?.closest('p');
      }
      if (videoDom) column.replaceChild(videoElement, videoDom);
    }

    switch (colIdx) {
      case 0:
        // container-reference div
        column.classList.add('hero-banner-item-image');
        if (!dynamicMedia) {
          appendHeroBannerMobileImageColumn(column, getHeroBannerItemMobileImageColumn(row));
        }
        console.log(dynamicMedia);
        normalizeImageReferenceLinks(column, createOptimizedPicture, {
          dynamicMedia,
        });
        // 处理image-theme联动nav
        if (column.lastElementChild?.innerHTML.length === 4) {
          theme = column.lastElementChild?.innerHTML || 'false';
          column.lastElementChild?.remove();
        } else theme = 'false';
        slide.classList.add(theme === 'true' ? 'dark' : 'light');
        if (isVideoMediaColumn(column)) {
          // video mode
          column.classList.add('video-mode');
          const videoMediaQuery = window.matchMedia(`(min-width: ${SCREEN_POINT}px)`);
          // 初始化执行 + 注册 change 监听
          updateVideoSource(videoMediaQuery.matches);
          videoMediaQuery.addEventListener('change', (e) => {
            updateVideoSource(e.matches);
          });
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
        if (column.textContent.trim()) {
          titleExist = true;
          textContent.append(column);
        } else {
          titleExist = false;
        }
        break;
      case 3:
        // richtext div
        column.setAttribute('class', 'hero-banner-item-content');
        textContent.append(column);
        if (!column?.textContent?.trim?.()) {
          contentExist = false;
        }
        break;
      case 4:
        // icon-svg div
        column.setAttribute('class', 'hero-banner-item-content icon-svg');
        break;
      case 7:
        // check is external video
        isExternal = column.textContent;
        if (isExternal) {
          column.textContent = '';
        }
        break;
      case 8:
        if (isExternal?.toLowerCase?.() === 'true') {
          const columnPEl = column?.querySelector('p');
          if (columnPEl) {
            externalVideoUrl = columnPEl?.textContent ?? null;
            if (externalVideoUrl) {
              const resetVideoUrl = resetExternalUrl(externalVideoUrl?.trim());
              const externalVideoEl = iframeVideoHandler(resetVideoUrl);
              // externalVideoEl.querySelector('iframe').style.height = '780px'
              const imageEl = slide.querySelector('.hero-banner-item-image');
              if (imageEl) {
                imageEl.innerHTML = '';
                imageEl.appendChild(externalVideoEl);
              } else {
                column.classList.add('hero-banner-item-image');
                column.appendChild(externalVideoEl);
              }
            }
            columnPEl.textContent = '';
          }
        }
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
    } else {
      slide.append(column);
    }
  });
  if (buttonDiv.children.length > 0) {
    buttonExist = true;
    div.append(buttonDiv);
  } else {
    buttonExist = false;
  }
  if (contentExist) {
    // hero-banner-item-content
    const contentEl = textContent.querySelector('.hero-banner-item-content');
    if (titleExist && buttonExist) {
      contentEl.classList.add('content-all');
    } else if (!titleExist && buttonExist) {
      contentEl.classList.add('content-no-title');
    } else if (titleExist && !buttonExist) {
      contentEl.classList.add('content-no-button');
    } else if (!titleExist && !buttonExist) {
      contentEl.classList.add('content-no-title-button');
    }
  }
  slide.append(div);
  return slide;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const config = readHeroBannerConfig(rows);
  const slideRows = rows.filter((row) => !isHeroBannerConfigRow(row));
  const isSingleSlide = slideRows.length < 2;
  const legacyDynamicMedia = isTruthy(config['dynamic-media']);
  const wholeContainer = createElement('ul', 'hero-banner-items-container');
  let slideIndicators;
  if (!isSingleSlide) {
    slideIndicators = createElement('ol', 'hero-banner-item-indicators');
  }
  slideRows.forEach((row, idx) => {
    const slide = createSlide(block, row, idx, { dynamicMedia: legacyDynamicMedia });
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
  rows.filter(isHeroBannerConfigRow).forEach((row) => row.remove());
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
    slideNavButtons.appendChild(createScrollButton('arrow', 'left'));
    slideNavButtons.appendChild(createScrollButton('arrow', 'right'));
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
    video?.querySelector('.video-play-icon')?.addEventListener('click', throttle((e) => {
      if (e.target.parentElement.classList.contains('is-playing')) {
        e.target.parentElement.classList.remove('is-playing');
        e.target.parentElement.classList.add('is-paused');
        e.target.closest('li').querySelector('video')?.pause();
      } else {
        e.target.parentElement.classList.remove('is-paused');
        e.target.parentElement.classList.add('is-playing');
        e.target.closest('li').querySelector('video')?.play();
      }
      autoPlay(block);
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
