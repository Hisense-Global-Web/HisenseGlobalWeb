/* eslint-disable func-names */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { isMobileWindow } from '../../scripts/device.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  ul.className = 'industry-categories-ul';
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.classList.add('card-item');
    const cardbody = document.createElement('div');
    cardbody.classList.add('card-body');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div, index) => {
      if (div.children.length === 2 && div.querySelector('picture')) {
        div.className = 'card-image';
      } else if (div.children.length === 1 && index === 0) {
        div.className = 'card-title';
      } else {
        Array.from(div.children).forEach((child) => {
          const wrapper = document.createElement('div');
          wrapper.appendChild(child);
          cardbody.appendChild(wrapper);
        });
        div.remove();
      }
    });
    li.append(cardbody);
    if (ul.children.length === 0) {
      li.classList.add('active');
    }

    // li 展开操作
    function liExpandFn(el) {
      const container = el.parentElement; // ul
      const allCards = container.querySelectorAll('.card-item');
      // 移除所有激活状态
      allCards.forEach((card) => {
        card.classList.remove('active');
      });
      // 设置当前激活卡片
      el.classList.add('active');
      function calculateWidth(vwValue, maxPx) {
        return Math.min(vwValue, maxPx);
      }
      // 计算并设置grid列宽
      const activeIndex = Array.from(allCards).indexOf(el);
      let columns = '';
      // eslint-disable-next-line no-shadow, no-plusplus
      for (let i = 0; i < allCards.length; i++) {
        columns += (i === activeIndex ? calculateWidth('22.222222vw', '320px') : calculateWidth('10vw', '144px'));
      }
      // 应用新的列宽
      container.style.gridTemplateColumns = columns;
    }

    li.onclick = function () {
      // 移动端时添加 click 事件
      if (!isMobileWindow()) return;
      liExpandFn(this);
    };

    li.onmouseenter = function () {
      // PC 端添加 hover 事件
      if (isMobileWindow()) return;
      liExpandFn(this);
    };
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.replaceChildren(ul);
  const industryItemDom = block.querySelectorAll('.industry-categories-ul li');
  // card-body 内的 div 和 a 标签交替出现
  industryItemDom.forEach((item) => {
    const itemCardBody = item.querySelector('.card-body');
    const cardBodyChildDom = itemCardBody.children;
    [...cardBodyChildDom].forEach((card, cardIdx) => {
      // 如果 div 内有 a 标签，且该元素的前一个元素不包含 a 标签，则将前一个元素的文本内容移到 a 标签内，否则删除该只有链接的 div
      if (card.querySelector('a')) {
        card.classList.add('card-item-link');
        const link = card.querySelector('a');
        const textElement = cardBodyChildDom[cardIdx - 1];
        if (textElement && textElement.textContent && textElement.querySelector('a') === null) {
          // 将文本内容移到 a 标签内，并隐藏原文本元素
          link.textContent = textElement.textContent;
          textElement.classList.add('item-hide');
        } else {
          // 没有文本元素，只配置了链接，隐藏该元素
          card.classList.add('item-hide');
        }
      } else {
        card.classList.add('card-item-text');
      }
    });
  });
}
