import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  const title = document.createElement('div');
  const [titleEl, pcColumnsEl, mobileColumnsEl, ...rows] = [...block.children];
  title.className = 'title';
  title.append(titleEl);

  pcColumnsEl?.remove();
  mobileColumnsEl?.remove();
  if (rows?.length) {
    rows.forEach((row) => {
      const li = document.createElement('li');
      li.classList.add('card-item');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1 && div.querySelector('picture')) div.className = 'card-image';
        else div.className = 'card-body';
      });
      ul.append(li);
    });
    ul.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });
  }

  // 使用 matchMedia API
  const mediaQuery = window.matchMedia('(min-width: 860px)');
  function handleMediaChange(e) {
    if (e.matches) {
      // PC
      const pcNumberColumns = pcColumnsEl?.querySelector('p')?.textContent ?? 3;
      ul.style.cssText = `grid-template-columns: repeat(${pcNumberColumns}, 1fr);`;
    } else {
      // Mobile
      const mobileColumns = mobileColumnsEl.querySelector('p')?.textContent ?? 'tiled';
      if (mobileColumns === 'tiled') {
        ul.classList.add('mobile-tiled');
        [...ul.children].forEach((li) => {
          li.classList.add('mobile-titled-li');
        });
      } else {
        ul.classList.remove('mobile-tiled');
        ul.style.cssText = `grid-template-columns: repeat(${mobileColumns}, 1fr);`;
      }
    }
  }

  // 初始调用
  handleMediaChange(mediaQuery);

  // 监听媒体查询变化
  mediaQuery.addEventListener('change', handleMediaChange);
  block.replaceChildren(title, ul);
}
