import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  const title = document.createElement('div');
  [...block.children].forEach((row, i) => {
    if (i <= 1) {
      title.className = 'title';
      const div = document.createElement('div');
      moveInstrumentation(row, div);
      title.append(row);
    } else {
      const li = document.createElement('li');
      li.classList.add('card-item');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div, index) => {
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'card-image';
          div.setAttribute('data-card-index', index);
          const arrow = document.createElement('img');
          arrow.className = 'arrow';
          arrow.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
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
          div.className = 'card-body';
          const tit = document.createElement('div');
          const desc = document.createElement('div');
          tit.append(div.firstElementChild);
          desc.append(div.lastElementChild);
          div.replaceChildren(tit, desc);
        }
      });
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
