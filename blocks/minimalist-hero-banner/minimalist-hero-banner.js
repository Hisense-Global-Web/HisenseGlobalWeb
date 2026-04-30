import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';
import { readBlockConfig } from '../../scripts/aem.js';
export default async function decorate(block) {
  const textContainer = document.createElement('div');
  const config = readBlockConfig(block);
  console.log(config, 'config');
  [...block.children].forEach((child) => {
    // if (child.querySelector('picture')) {
    //   // child.setAttribute('class', 'banner-image');
    //   // block.append(child);
    // } else {
    //   const key = child.children[0].textContent.trim();
    //   if (key && Object.keys(config).includes(key.toLowerCase())) {
    //     child.classList.add(key);
    //     child.children[0].remove();
    //   }
    //   textContainer.append(child);
    //   textContainer.setAttribute('class', 'text-container h-grid-container');
    //   // block.replaceChild(textContainer, child);
    // }
    // const key = child.children[0].textContent.trim();
    // if (key && Object.keys(config).includes(key.toLowerCase())) {
    //   child.classList.add(key);
    //   child.children[0].remove();
    // }
    // if (key === 'background-image') {
    //   child.setAttribute('class', 'banner-image');
    //   block.append(child);
    // } else {
    //   textContainer.append(child);
    //   textContainer.setAttribute('class', 'text-container h-grid-container');
    // }
    
  });
  // block.append(textContainer);

  getDynamicHeaderHeight(block);
}
