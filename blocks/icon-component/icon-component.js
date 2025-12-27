import { whenElementReady, updatePosition, getSlideWidth } from '../../utils/carousel.js';

let index = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('.item');
  const bodyWidth = document.body.getBoundingClientRect().width;
  cards.forEach((card) => {
    const link = card.querySelector('a');
    const url = link?.href;
    card.addEventListener('click', () => {
      if (url) window.location.href = url;
    });
  });
  const firstCardLeft = cards[0].getBoundingClientRect().left;
  if (cards.length * getSlideWidth(block) + firstCardLeft >= bodyWidth) {
    block.querySelector('.pagination').classList.add('show');
  }
  block.querySelector('.slide-prev').addEventListener('click', () => {
    if (index > 0) {
      index -= 1;
      updatePosition(block, index, true);
    }
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    if (index < cards.length) {
      index += 1;
      updatePosition(block, index, true);
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
  const lastchild = iconBlocks.lastElementChild.cloneNode(true);
  iconBlocks.appendChild(lastchild);
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
  whenElementReady('.icon-component', () => {
    bindEvent(block);
  });
}
