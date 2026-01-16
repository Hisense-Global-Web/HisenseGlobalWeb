import {
  updatePosition,
  getSlideWidth,
  resizeObserver,
  throttle,
} from '../../utils/carousel-common.js';

let index = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('li');
  const ul = block.querySelector('ul');
  const containerWidth = block.querySelector('.icon-viewport').offsetWidth;
  if (!block.classList.contains('text-left')) {
    // 展示button组件，卡片不需要点击，通过button跳转
    cards.forEach((card) => {
      const link = card.querySelector('a');
      const url = link?.href;
      card.addEventListener('click', () => {
        if (url) window.location.href = url;
      });
    });
  }
  const { gap } = window.getComputedStyle(ul);
  if (cards.length * getSlideWidth(block) - parseFloat(gap) > containerWidth) {
    block.querySelector('.pagination').classList.add('show');
  }
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
  ul.addEventListener('scroll', () => {
    const box = block.querySelector('.icon-component-wrapper');
    box.style.padding = '0 !important';
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
    let ctaDiv;
    [...child.children].forEach((item, _i) => {
      switch (_i) {
        case 0:
          item.classList.add('item-picture');
          break;
        case 2:
          item.classList.add('item-cta');
          if (block.classList.contains('text-left')) item.classList.add('show');
          // cta 和label不能自动组合
          if ([...item.children].length === 2) {
            item.querySelector('a').innerHTML = item.lastElementChild.innerHTML;
            item.lastElementChild.remove();
          }
          ctaDiv = item;
          break;
        default:
          item.classList.add('item-text');
      }
      if (!item.innerHTML) item.remove();
    });
    iconBlock.appendChild(child);
    iconBlock.appendChild(ctaDiv);
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
  resizeObserver('.icon-component', () => {
    bindEvent(block);
  });
}
