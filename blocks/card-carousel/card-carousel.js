import {
  updatePosition,
  getSlideWidth,
  throttle,
  mobilePressEffect,
  resizeObserver,
} from '../../utils/carousel-common.js';
import { createElement, debounce } from '../../utils/dom-helper.js';

const cardCarouselId = 0;

function bindEvent(block) {
  const cards = block.querySelectorAll('li');
  const ul = block.querySelector('ul');
  const containerWidth = block.querySelector('.card-carousel-viewport').offsetWidth;
  const viewportWidth = window.innerWidth;
  // text-left type展示button组件，卡片不需要点击，通过button跳转
  if (!block.classList.contains('text-left')) {
    const goToNextPage = (card) => {
      const link = card.querySelector('a');
      const url = link?.href;
      card.addEventListener('click', () => {
        if (url) window.location.href = url;
      });
    };
    cards.forEach((card) => {
      mobilePressEffect(viewportWidth, card, () => {
        goToNextPage(card);
      });
    });
  }
  const { gap } = window.getComputedStyle(ul);
  if (cards.length * getSlideWidth(block) - parseFloat(gap) > containerWidth) {
    block.querySelector('.card-carousel-pagination').classList.add('show');
  }
  block.querySelector('.slide-prev').addEventListener('click', throttle(() => {
    let index = parseInt(block.dataset.slideIndex, 10);
    if (index > 0) {
      index -= 1;
      updatePosition(block, index, 'click');
    }
  }, 500));
  block.querySelector('.slide-next').addEventListener('click', throttle(() => {
    let index = parseInt(block.dataset.slideIndex, 10);
    if (index < cards.length) {
      index += 1;
      updatePosition(block, index, 'click');
    }
  }, 500));
}

export default async function decorate(block) {
  block.dataset.slideIndex = 0;
  block.setAttribute('id', `card-carousel-${cardCarouselId}`);
  const cardCarouselContainer = createElement('div', 'card-carousel-viewport');
  const cardCarouselBlocks = createElement('ul', 'card-carousel-track');
  const titleBox = createElement('div', 'card-carousel-title-box');
  [...block.children].forEach((child, idx) => {
    // except subtitle and title
    if (idx <= 1) {
      titleBox.appendChild(child);
      return;
    }
    const cardCarouselBlock = document.createElement('li');
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
    cardCarouselBlock.appendChild(child);
    cardCarouselBlock.appendChild(ctaDiv);
    cardCarouselBlocks.appendChild(cardCarouselBlock);
  });
  cardCarouselContainer.appendChild(cardCarouselBlocks);
  block.appendChild(titleBox);
  block.appendChild(cardCarouselContainer);

  if (cardCarouselBlocks.children) {
    const buttonContainer = createElement('div', 'card-carousel-pagination');
    buttonContainer.innerHTML = `
      <button type="button" class="slide-prev" disabled></button>
      <button type="button" class="slide-next"></button>
    `;
    block.appendChild(buttonContainer);
  }
  bindEvent(block);
  // check which block inner viewport
  const mutation = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        resizeObserver(entry.target.id, debounce((target) => {
          if (target.id === block.id) {
            updatePosition(block, parseInt(block.dataset.slideIndex, 10), 'resize');
          }
        }, 500));
      }
    });
  }, { threshold: 1 });
  mutation.observe(block);
}
