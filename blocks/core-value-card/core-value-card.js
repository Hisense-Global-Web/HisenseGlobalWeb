import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  const title = document.createElement('div');
  const button = document.createElement('div');
  [...block.children].forEach((row, i) => {
    if (i <= 1) {
      title.className = 'title';
      title.append(...row.children);
    } else if (i === 2) {
      // handle button
      const target = row.firstElementChild;
      if (target.querySelector('a')) {
        target.querySelector('a').classList.add(target.firstElementChild.textContent);
        target.firstElementChild.remove();
        if (target.lastElementChild !== target.querySelector('.button-container')) {
          target.querySelector('a').textContent = target.lastElementChild.textContent;
          target.lastElementChild.remove();
        }
        button.append(...row.firstElementChild.children);
      }
    } else {
      const li = document.createElement('li');
      li.classList.add('card-item');
      const cardbody = document.createElement('div');
      cardbody.className = 'card-body';
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div, index) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'card-image';
          div.setAttribute('data-card-index', index);
          const arrow = document.createElement('img');
          if (i === 3) {
            arrow.classList.add('arrow');
          } else {
            arrow.classList.add('arrow', 'hide');
          }
          arrow.src = `/content/dam/hisense/${country}/common-icons/chevron-white-up.svg`;
          arrow.setAttribute('data-target-index', index);
          arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetIndex = e.target.getAttribute('data-target-index');
            const allCards = document.querySelectorAll('.card-image');
            const targetCard = allCards[targetIndex];
            if (targetCard) {
              // 找到这个卡片相关的需要显示/隐藏的内容
              const contentToToggle = targetCard.nextElementSibling;
              if (contentToToggle) {
                // 更新箭头状态
                e.target.classList.toggle('hide');
              }
            }
            // const grandParent = e.target.closest('.arrow');
            // if (!grandParent) { return; }
            // grandParent.classList.toggle('hide');
          });
          div.append(arrow);
        } else {
          cardbody.append(div);
          // const { length } = children;
          // if (length > 0) {
          //   const tit = document.createElement('div');
          //   const desc = document.createElement('div');
          //   tit.append(children[0]);
          //   if (length > 1) {
          //     desc.append(children[children.length - 1]);
          //   }
          //   div.replaceChildren(tit, desc);
          // }
        }
        li.append(cardbody);
      });
      ul.append(li);
    }
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(title, ul, button);
}
