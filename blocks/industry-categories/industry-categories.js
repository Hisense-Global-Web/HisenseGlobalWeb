/* eslint-disable func-names */
import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';


export default function decorate(block) {
  const config = readBlockConfig(block);
  console.log(config);
  /* change to ul, li */
  const ul = document.createElement('ul');
  const title = document.createElement('div');
  [...block.children].forEach((row, i) => {
    if (i <= 2) {
      title.className = 'title';
      title.append(row);
    } else {
      const li = document.createElement('li');
      li.classList.add('card-item');
      const cardbody = document.createElement('div');
      cardbody.classList.add('card-body');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'card-image';
        } else {
          Array.from(div.children).forEach((child) => {
            const wrapper = document.createElement('div');
            wrapper.appendChild(child);
            cardbody.appendChild(wrapper);
          });
          div.remove();
          li.append(cardbody);
        }
      });
      if (ul.children.length === 0) {
        li.classList.add('active');
      }

      li.onclick = function () {
        const container = this.parentElement; // ul
        const allCards = container.querySelectorAll('.card-item');
        // 移除所有激活状态
        allCards.forEach((card) => {
          card.classList.remove('active');
        });
        // 设置当前激活卡片
        this.classList.add('active');
        function calculateWidth(vwValue, maxPx) {
          return Math.min(vwValue, maxPx);
        }
        // 计算并设置grid列宽
        const activeIndex = Array.from(allCards).indexOf(this);
        let columns = '';
        // eslint-disable-next-line no-shadow, no-plusplus
        for (let i = 0; i < allCards.length; i++) {
          columns += (i === activeIndex ? calculateWidth('25vw', '360px') : calculateWidth('12.0833333vw', '174px'));
        }
        // 应用新的列宽
        container.style.gridTemplateColumns = columns;
      };
      ul.append(li);
    }
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.replaceChildren(title, ul);
}
