let index = 0;

function getSlideWidth(block) {
  const singleItem = block.querySelector('li');
  // const gap = 24;
  return singleItem.offsetWidth;
}

function updatePosition(block) {
  const trackBox = block.querySelector('.icon-track');
  const items = block.querySelectorAll('li');
  const prev = (index - 1) * getSlideWidth(block);
  let maxlength = Math.ceil((items.length * getSlideWidth(block)) / trackBox.offsetWidth);
  const { gap } = window.getComputedStyle(trackBox);
  if (trackBox.offsetWidth <= 600) maxlength = items.length - 1;
  if (index === maxlength && trackBox.offsetWidth > 800) {
    const lastDistance = trackBox.offsetWidth
      - items[items.length - 1].getBoundingClientRect().left;
    trackBox.style.transform = `translateX(-${prev + Math.abs(lastDistance) + parseFloat(gap)}px)`;
  } else {
    trackBox.style.transform = `translateX(-${prev + getSlideWidth(block)}px)`;
  }
  trackBox.style.transition = 'all 0.5';
  block.querySelector('.slide-prev').disabled = (index === 0);
  block.querySelector('.slide-next').disabled = (index >= maxlength);
}

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  const wholeCards = block.querySelector('.icon-track');
  cards.forEach((card) => {
    const link = card.querySelector('a');
    const url = link?.href;
    card.addEventListener('click', () => {
      if (url) window.location.href = url;
    });
  });
  if (cards.length * getSlideWidth(block) >= wholeCards.offsetWidth) {
    block.querySelector('.pagination').classList.add('show');
  }
  block.querySelector('.slide-prev').addEventListener('click', () => {
    if (index > 0) {
      index -= 1;
      updatePosition(block);
    }
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    if (index < cards.length) {
      index += 1;
      updatePosition(block);
    }
  });
}
// mobile touchEvent
function touchEvent(block) {
  let startX;
  let prevX;
  let X;
  block.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startX = e.changedTouches[0].pageX;
  });
  block.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const moveEndX = e.changedTouches[0].pageX;
    X = moveEndX - startX;
  });
  block.addEventListener('touchend', (e) => {
    e.preventDefault();
    const node = e.target.closest('div');
    if (prevX === X) {
      node.click();
      return;
    }
    prevX = X;
    if (X > 0) {
      // 左滑
      block.querySelector('.slide-prev').click();
    } else if (X < 0) {
      // 右滑
      block.querySelector('.slide-next').click();
    }
  });
}

export default async function decorate(block) {
  const iconContainer = document.createElement('div');
  iconContainer.classList.add('icon-viewport');
  const iconBlocks = document.createElement('ul');
  iconBlocks.classList.add('icon-track');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx <= 1) return;
    const iconBlock = document.createElement('li');
    child.classList.add('item');
    [...child.children].forEach((item) => {
      if (item.querySelector('picture')) {
        item.querySelector('picture').closest('div').classList.add('item-picture');
      }
      if (item.querySelector('.button-container')) {
        item.querySelector('.button-container').closest('div').classList.add('item-cta');
        if (block.classList.contains('text-left')) {
          item.querySelector('.button-container').closest('div').classList.add('show');
        }
      }
      if (item.querySelector('a')) {
        item.querySelector('a').closest('div').classList.add('item-cta');
      }
      if (!item.innerHTML) item.remove();
    });
    iconBlock.appendChild(child);
    iconBlocks.appendChild(iconBlock);
  });
  iconContainer.appendChild(iconBlocks);
  block.appendChild(iconContainer);

  if (iconBlocks.children) {
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('pagination');
    buttonContainer.innerHTML = `
      <button type="button" class="slide-prev" disabled></button>
      <button type="button" class="slide-next"></button>
    `;
    block.appendChild(buttonContainer);
  }
  bindEvent(block);
  touchEvent(block);
}
