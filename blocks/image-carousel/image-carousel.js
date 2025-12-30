import {
  getSlideWidth,
  updatePosition,
  resizeObserver,
  throttle,
} from '../../utils/carousel-common.js';

let carouselId = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  const bodyWidth = document.body.getBoundingClientRect().width;
  let index = 0;
  const firstCardLeft = cards[0].getBoundingClientRect().left;
  if (cards.length * getSlideWidth(block) + firstCardLeft >= bodyWidth) {
    block.querySelector('.image-pagination').classList.add('show');
  }
  // 按钮处理
  block.querySelector('.slide-prev').addEventListener('click', throttle(() => {
    if (index > 0) {
      index -= 1;
      updatePosition(block, index, true);
    }
  }, 500));
  block.querySelector('.slide-next').addEventListener('click', throttle(() => {
    if (index < cards.length) {
      index += 1;
      updatePosition(block, index, true);
    }
  }, 500));
  // 视频处理
  block.querySelector('.image-track').addEventListener('click', (e) => {
    const dataIndex = e.target.closest('li').dataset.slideIndex;
    block.querySelectorAll('li').forEach((el, i) => {
      if (String(i) === dataIndex) {
        el.querySelector('video').muted = true;
        el.querySelector('video')?.play();
      } else {
        el.querySelector('video').muted = true;
        el.querySelector('video')?.pause();
      }
    });
    if (e.target.tagName === 'IMG') {
      e.target.closest('div').style.display = 'none';
    }
  });
}

function createVideo(child, idx) {
  let videourl;
  const link = child.querySelector('a');
  if (link) {
    videourl = link.href;
  }
  const videoDivDom = document.createElement('div');
  videoDivDom.className = 'video-div-box';
  const img = child.querySelector('img');
  const video = document.createElement('video');
  video.id = `video-${carouselId}-carousel-${idx}`;
  video.controls = true;
  // video.width = large ? 800 : 652;
  // video.height = large ? 452 : 368;
  video.preload = 'auto';
  video.autoplay = false;
  const source = document.createElement('source');
  source.src = videourl; // 替换为你的视频路径
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  // video.muted = true;
  video.appendChild(source);
  // img.closest('div').addEventListener('click', () => {
  //   video.play();
  //   img.closest('div').style.display = 'none';
  // });
  videoDivDom.appendChild(video);
  videoDivDom.appendChild(img);
  return videoDivDom;
}

export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `image-carousel-${carouselId}`);
  const contentType = block.children[2].innerHTML.includes('video') ? 'video' : 'Image';
  const iconContainer = document.createElement('div');
  iconContainer.classList.add('image-viewport');
  const iconBlocks = document.createElement('ul');
  iconBlocks.classList.add('image-track');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx === 2) { child.remove(); }
    if (idx <= 2) return;
    const iconBlock = document.createElement('li');
    child.classList.add('item');
    iconBlock.dataset.slideIndex = idx - 3;
    if (contentType === 'video') {
      block.classList.add('video-carousel-block');
      let singleVideo;
      if (block.classList.contains('bottom-center-style')) {
        child.classList.add('video-type');
        singleVideo = createVideo(child, idx);
      } else {
        singleVideo = createVideo(child, idx);
        child.classList.add('video-only');
      }
      if (child.querySelector('picture')) {
        child.querySelector('picture').closest('div').classList.add('video-play');
      }
      if (singleVideo) child.replaceChild(singleVideo, child.firstElementChild);
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
    iconBlock.appendChild(child);
    iconBlocks.appendChild(iconBlock);
  });
  iconContainer.appendChild(iconBlocks);
  block.appendChild(iconContainer);

  if (iconBlocks.children) {
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('image-pagination');
    buttonContainer.innerHTML = `
      <button type="button" class="slide-prev" disabled></button>
      <button type="button" class="slide-next"></button>
    `;
    block.appendChild(buttonContainer);
  }
  // whenElementReady('.image-carousel', () => {
  //   bindEvent(block);
  // });
  resizeObserver('.image-carousel', () => {
    bindEvent(block);
  });
}
