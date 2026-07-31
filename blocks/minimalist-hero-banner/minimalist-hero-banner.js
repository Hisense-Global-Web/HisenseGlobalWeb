import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default async function decorate(block) {
  const textContainer = document.createElement('div');
  const config = readBlockConfig(block);
  // let dynamicMediaFlag = '';
  [...block.children].forEach((child) => {
    const key = child.children[0].textContent.trim();
    if (key && Object.keys(config).includes(key.toLowerCase())) {
      child.classList.add(key);
      child.children[0].remove();
    }
    if (key === 'dynamic-media') {
      // dynamicMediaFlag = child.textContent.trim();
      // 只要需要通过判断 background-image 是否包含 a 标签，来决定是否创建dynamic media pickter
      child.remove();
    } else if (key === 'background-image') {
      child.setAttribute('class', 'banner-image');
      if (child.querySelector('a')) {
        const dynamicImgSrc = child.querySelector('a').getAttribute('href');
        child.append(createDynamicMediaPicture(dynamicImgSrc, 'minimalist-hero-banner'));
        child.children[0].remove();
      }
    } else {
      textContainer.append(child);
      textContainer.setAttribute('class', 'text-container h-grid-container');
    }
  });
  block.append(textContainer);

  getDynamicHeaderHeight(block);
}
