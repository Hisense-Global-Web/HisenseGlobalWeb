import {
  getSlideWidth,
  updatePosition,
  throttle,
  setupObserver,
  whenElementReady,
  cancelListener,
} from '../../utils/carousel-common.js';
import { createElement, debounce } from '../../utils/dom-helper.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';

let carouselId = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  const maxWidth = block.querySelector('.media-carousel-viewport').offsetWidth;
  let index = 0;
  const gap = parseInt(window.getComputedStyle(block.querySelector('.media-carousel-track')).gap, 10) || 0;
  if (cards.length * getSlideWidth(block) - gap >= maxWidth) {
    block.querySelector('.media-carousel-pagination').classList.add('show');
  }
  // 按钮处理
  cancelListener(block, '.slide-prev');
  block.querySelector('.slide-prev').addEventListener('click', throttle(() => {
    if (index > 0) {
      index -= 1;
      updatePosition(block, index, true);
    }
  }, 500));
  cancelListener(block, '.slide-next');
  block.querySelector('.slide-next').addEventListener('click', throttle(() => {
    if (index < cards.length) {
      index += 1;
      updatePosition(block, index, true);
    }
  }, 500));
  if (!block.classList.contains('video-media-carousel-block')) return;
  // 视频处理
  block.querySelector('.video-media-carousel-block .media-carousel-track').addEventListener('click', (e) => {
    const dataIndex = e.target.closest('li').dataset.slideIndex;
    block.querySelectorAll('li').forEach((el, i) => {
      if (String(i) === dataIndex) {
        el.querySelector('video')?.play();
      } else {
        el.querySelector('video')?.pause();
      }
    });
    if (e.target.tagName === 'IMG' && e.target.closest('li').querySelector('video')) {
      e.target.style.display = 'none';
    }
  });
  if (isUniversalEditor()) return;
  whenElementReady('.video-media-carousel-block', () => {
    const videos = block.querySelectorAll('.video-autoPlay');
    setupObserver(block, videos, (e) => {
      // resolveCallback
      e.closest('li').querySelector('img').style.display = 'none';
      e.click();
    }, () => {
      // leaveCallback - leave block viewport
      videos.forEach((video) => {
        video.pause();
      });
    });
  });
}

function createVideo(child, idx) {
  let videourl;
  const link = child.querySelector('a');
  if (link) {
    videourl = link.href;
  }
  const videoDivDom = createElement('div', 'video-div-box');
  const img = child.querySelector('img');
  const video = createElement('video', 'video-autoPlay');
  video.id = `video-${carouselId}-carousel-${idx - 2}`;
  video.controls = true;
  video.preload = 'auto';
  video.autoplay = false;
  video.loop = true;
  const source = document.createElement('source');
  source.src = videourl; // 替换为你的视频
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  video.muted = true;
  video.playsInline = true;
  video.appendChild(source);
  videoDivDom.appendChild(video);
  videoDivDom.appendChild(img);
  return videoDivDom;
}

export default async function decorate(block) {
  const index = 0;
  carouselId += 1;
  block.setAttribute('id', `media-carousel-${carouselId}`);
  const contentType = block.children[2].innerHTML.includes('video') ? 'video' : 'Image';
  const mediaCarouselContainer = createElement('div', 'media-carousel-viewport');
  const mediaCarouselBlocks = createElement('ul', 'media-carousel-track');
  const titleBox = createElement('div', 'carousel-title-box');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx <= 2) {
      if (idx !== 2) titleBox.appendChild(child);
      else child.remove();
      return;
    }
    const mediaBlock = document.createElement('li');
    child.classList.add('item');
    mediaBlock.dataset.slideIndex = idx - 3;
    if (contentType === 'video') {
      block.classList.add('video-media-carousel-block');
      let singleVideo;
      if (block.classList.contains('bottom-center-style')) {
        child.classList.add('video-center-type');
        singleVideo = createVideo(child, idx);
      } else {
        singleVideo = createVideo(child, idx);
        child.classList.add('video-only');
      }
      if (child.querySelector('picture')) {
        child.querySelector('picture').closest('div').classList.add('video-play');
        child.querySelector('picture').closest('div').remove();
      }
      if (singleVideo && child.firstElementChild.querySelector('a')) child.replaceChild(singleVideo, child.firstElementChild);
      child.lastElementChild?.classList.add('item-content');
    } else {
      [...child.children].forEach((item) => {
        if (item.querySelector('picture')) {
          item.querySelector('picture').closest('div').classList.add('item-picture');
        } else if (item.querySelector('.button-container')) {
          item.querySelector('.button-container').closest('div').classList.add('item-cta');
        } else {
          item.classList.add('item-content');
        }
        if (!item.innerHTML) item.remove();
      });
    }
    mediaBlock.appendChild(child);
    mediaCarouselBlocks.appendChild(mediaBlock);
  });
  mediaCarouselContainer.appendChild(mediaCarouselBlocks);
  block.appendChild(titleBox);
  block.appendChild(mediaCarouselContainer);

  if (mediaCarouselBlocks.children) {
    const buttonContainer = createElement('div', 'media-carousel-pagination');
    buttonContainer.innerHTML = `
      <button type="button" class="slide-prev" disabled></button>
      <button type="button" class="slide-next"></button>
    `;
    block.appendChild(buttonContainer);
  }
  bindEvent(block, index);
  window.onresize = debounce(() => {
    updatePosition(block, index, true);
  }, 500);
}
