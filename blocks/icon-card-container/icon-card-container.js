import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const box = document.createElement('div');
  box.classList.add('icon-container-box');
  [...block.children].forEach((row) => {
    const item = document.createElement('div');
    item.classList.add('icon-container-item');
    moveInstrumentation(row, item);
    while (row.firstElementChild) item.append(row.firstElementChild);
    const text = document.createElement('div');
    text.className = 'icon-container-item-text';
    [...item.children].forEach((div) => {
      if (div.innerHTML.trim() === '') {
        div.remove();
      }
      if (div.querySelector('picture') && div.children.length === 1) { div.className = 'icon-image'; }
      else {
        div.className = 'icon-text';
        if (div.innerHTML.trim() !== '') {
          text.append(div);
        }
      }
    });
    if (text.innerHTML.trim() !== '') {
      item.append(text);
    }
    // or use div.
    box.append(item);
  });
  box.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ height: '40px' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(box);
}
