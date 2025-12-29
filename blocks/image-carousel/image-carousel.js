import {
  getSlideWidth,
  updatePosition,
  resizeObserver,
} from '../../utils/carousel-common.js';

let carouselId = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  const ul = block.querySelector('ul');
  const bodyWidth = document.body.getBoundingClientRect().width;
  let index = 0;
  const firstCardLeft = cards[0].getBoundingClientRect().left;
  if (cards.length * getSlideWidth(block) + firstCardLeft >= bodyWidth) {
    block.querySelector('.image-pagination').classList.add('show');
  }
  const maxlength = Math.ceil(cards.length - ul.offsetWidth / getSlideWidth(block));
  block.querySelector('.slide-prev').addEventListener('click', () => {
    if (index > 0) {
      index -= 1;
      updatePosition(block, index, true);
    }
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    if (index < maxlength) {
      index += 1;
      updatePosition(block, index, true);
    }
  });
}

function createVideo(child, idx, large = false) {
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
  video.width = large ? 800 : 652;
  video.height = large ? 452 : 368;
  video.preload = 'auto';
  video.autoplay = false;
  const source = document.createElement('source');
  source.src = videourl; // 替换为你的视频路径
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  video.appendChild(source);
  img.closest('div').addEventListener('click', () => {
    video.play();
    img.closest('div').style.display = 'none';
  });
  videoDivDom.appendChild(video);
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
    if (contentType === 'video') {
      block.classList.add('video-carousel-block');
      let singleVideo;
      if (block.classList.contains('bottom-center-style')) {
        child.classList.add('video-type');
        singleVideo = createVideo(child, idx, true);
      } else {
        singleVideo = createVideo(child, idx);
      }
      if (child.querySelector('picture')) {
        child.querySelector('picture').closest('div').classList.add('video-play');
      }
      child.replaceChild(singleVideo, child.firstElementChild);
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
