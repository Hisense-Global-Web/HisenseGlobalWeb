let index = 0;
const visibleCards = 4; // 视口内显示的卡片数量

function getSlideWidth(block) {
  const singleItem = block.querySelector('li');
  const cardWidth = singleItem.offsetWidth;
  const gap = 24;
  return cardWidth + gap;
}

function updatePosition(block) {
  const track = block.querySelector('.icon-track');
  const items = block.querySelectorAll('li');
  const moveDistance = index * getSlideWidth(block);
  track.style.transform = `translateX(-${moveDistance}px)`;
  block.querySelector('.slide-prev').disabled = (index === 0);
  block.querySelector('.slide-next').disabled = (index >= items.length - visibleCards);
}

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  cards.forEach((item) => {
    const link = item.querySelector('a');
    const url = link?.href;
    item.addEventListener('click', () => {
      if (url) window.location.href = url;
    });
  });
  // prev and next button
  block.querySelector('.slide-prev').addEventListener('click', () => {
    if (index > 0) {
      index -= 1;
      updatePosition(block);
    }
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    if (index < cards.length - visibleCards) {
      index += 1;
      updatePosition(block);
    }
  });
}

export default async function decorate(block) {
  const iconContainer = document.createElement('div');
  iconContainer.classList.add('icon-viewport');

  const iconBlocks = document.createElement('ul');
  iconBlocks.classList.add('icon-track');
  iconContainer.appendChild(iconBlocks);

  [...block.children].forEach((child) => {
    child.classList.add('item');
    const iconBlock = document.createElement('li');

    [...child.children].forEach((subchild) => {
      if (subchild.querySelector('picture')) {
        subchild.querySelector('picture').closest('div').classList.add('item-picture');
      }
      if (subchild.querySelector('.button-container')) {
        subchild.querySelector('.button-container').closest('div').classList.add('item-cta');
      }
      if (!subchild.innerHTML) subchild.remove();
    });

    iconBlock.appendChild(child);
    iconBlocks.appendChild(iconBlock);
  });
  block.prepend(iconContainer);
  // prev and next button
  let buttonContainer;
  if (iconBlocks.children.length > 0) {
    buttonContainer = document.createElement('div');
    buttonContainer.classList.add('pagination');
    buttonContainer.innerHTML = `
        <button type="button" class="slide-prev" disabled></button>
        <button type="button" class="slide-next"></button>
      `;
  }
  block.appendChild(buttonContainer);
  bindEvent(block);
  window.addEventListener('resize', updatePosition);
}
