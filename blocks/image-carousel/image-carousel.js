let index = 0;
const visibleImage = 2;
function getSlideWidth(block) {
  const singleItem = block.querySelector('li');
  const cardWidth = singleItem.offsetWidth;
  const gap = 30;
  return cardWidth + gap;
}

function updatePosition(block) {
  const track = block.querySelector('.image-track');
  const items = block.querySelectorAll('li');
  const moveDistance = index * getSlideWidth(block);

  track.style.transform = `translateX(-${moveDistance}px)`;
  block.querySelector('.slide-prev').disabled = (index === 0);
  block.querySelector('.slide-next').disabled = (index >= items.length - visibleImage);
}

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  if (cards.length > visibleImage) {
    block.querySelector('.image-pagination').classList.add('show');
  }
  block.querySelector('.slide-prev').addEventListener('click', () => {
    if (index > 0) {
      index -= 1;
      updatePosition(block);
    }
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    if (index < cards.length - visibleImage) {
      index += 1;
      updatePosition(block);
    }
  });
}

function createVideo(child, idx, large = false) {
  let videourl;
  let imgUrl;
  const link = child.querySelector('a');
  if (link) {
    videourl = link.href;
  }
  const img = child.querySelector('img');
  if (img) {
    imgUrl = img.src;
  }
  const video = document.createElement('video');
  video.id = `videoCarousel-${idx}`;
  video.controls = true;
  video.width = large ? 800 : 652;
  video.height = large ? 452 : 368;
  video.preload = 'auto';
  video.autoplay = false;
  // video.style.border = '1px solid #ccc';
  video.poster = imgUrl;
  const source = document.createElement('source');
  source.src = videourl; // 替换为你的视频路径
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  img.closest('div').addEventListener('click', () => {
    video.play();
    img.closest('div').style.display = 'none';
  });
  return video;
}

export default async function decorate(block) {
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
  bindEvent(block);
}
