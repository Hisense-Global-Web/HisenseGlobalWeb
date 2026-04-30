import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';
import { readBlockConfig } from '../../scripts/aem.js';
export default async function decorate(block) {
  const textContainer = document.createElement('div');
  const config = readBlockConfig(block);
  console.log(config, 'config');
  // console.log(block, 'blockkkk');
  [...block.children].forEach((child) => {
    if (child.querySelector('picture')) child.setAttribute('class', 'banner-image');
    else {
      // console.log(child, 'ccccc');
      textContainer.append(...child.firstElementChild.children);
      textContainer.setAttribute('class', 'text-container h-grid-container');
      block.replaceChild(textContainer, child);
      // const pAll = textContainer.querySelectorAll('p');
      // pAll.forEach((p, pIdx) => {
      //   if (pIdx === 0) {
      //     p.setAttribute('class', 'minimalist-title');
      //   } else {
      //     p.setAttribute('class', 'minimalist-subtitle');
      //   }
      // });
    }
  });

  getDynamicHeaderHeight(block);
}
