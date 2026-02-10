import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  const title = document.createElement('div');
  [...block.children].forEach((row, i) => {
    const li = document.createElement('li');
    li.classList.add('card-item');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.querySelector('picture')) div.className = 'card-image';
      else {
        div.className = 'card-body';
        const tit = document.createElement('div');
        const desc = document.createElement('div');
        tit.append(div.firstElementChild);
        desc.append(div.lastElementChild);
        div.replaceChildren(tit, desc);
      }
    });
    const diver = document.createElement('div');
    diver.className = 'diver';
    if (i < [...block.children].length - 1) {
      ul.append(li, diver);
    } else {
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
