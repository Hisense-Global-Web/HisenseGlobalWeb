import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
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
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'card-image';
        } else {
          div.className = 'card-body';
        }
      });
      if (ul.children.length === 0) {
        li.classList.add('active');
      }
      li.onclick = () => {
        const container = this.parentElement; // ul
        const allCards = container.querySelectorAll('.card-item');
        allCards.forEach((card) => {
          card.classList.remove('active');
        });

        this.classList.add('active');
        // 计算并设置grid列宽
        const activeIndex = Array.from(allCards).indexOf(this);
        let columns = '';
        // eslint-disable-next-line no-plusplus, no-shadow
        for (let i = 0; i < allCards.length; i++) {
          columns += (i === activeIndex ? '200px ' : '100px ');
        }
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
