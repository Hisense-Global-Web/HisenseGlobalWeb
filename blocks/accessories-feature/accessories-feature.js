// import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  const title = document.createElement('div');
  [...block.children].forEach((row, i) => {
    if (i === 0) {
      title.className = 'title';
      // const div = document.createElement('div');
      // moveInstrumentation(row, div);
      const [dynamicSwitch, imgDom] = [...row.querySelectorAll('p')] ?? [];
      // const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
      dynamicSwitch.remove();
      if (imgDom.querySelector('a')) {
        // 设置dynamic media
        const dynamicImgSrc = imgDom.querySelector('a').getAttribute('href');
        const dynamicImgDom = createDynamicMediaPicture(dynamicImgSrc, 'accessories-feature');
        imgDom.append(dynamicImgDom);
        imgDom.children[0].remove();
      }
      title.append(...row.children);
    } else {
      const li = document.createElement('li');
      li.classList.add('card-item');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 2 && (div.querySelector('picture') || div.querySelector('a'))) {
          div.className = 'card-image';
          const [dynamicSwitchItem, imgDom] = [...div.children] ?? [];
          // const isDynamicFlag = dynamicSwitchItem.textContent.trim() === 'true';
          dynamicSwitchItem.remove();
          if (imgDom.querySelector('a')) {
            // 设置dynamic media
            const dynamicImgSrc = imgDom.querySelector('a').getAttribute('href');
            imgDom.append(createDynamicMediaPicture(dynamicImgSrc, 'industry-categories-img'));
            imgDom.children[0].remove();
          }
        } else {
          div.className = 'card-body';
        }
      });
      ul.append(li);
    }
  });
  // ul.querySelectorAll('picture > img').forEach((img) => {
  //   const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
  //   moveInstrumentation(img, optimizedPic.querySelector('img'));
  //   img.closest('picture').replaceWith(optimizedPic);
  // });
  block.replaceChildren(title, ul);
}
