import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default async function decorate(block) {
  const featureItemsWrapperEl = document.createElement('div');
  featureItemsWrapperEl.className = 'feature-items-wrapper';

  [...block.children].forEach((child) => {
    child.className = 'feature-item-box';
    const itemTextBoxEl = document.createElement('div');
    itemTextBoxEl.className = 'item-text-box';

    const [dynamicSwitch, imgDom, subtitleDom, titDom, textDom] = [...child.children] ?? [];
    const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
    dynamicSwitch.remove();

    if (imgDom) {
      imgDom.classList.add('item-img-box');
      if (isDynamicFlag && imgDom.querySelector('a')) {
        // 设置dynamic media 元素
        const dynamicImgSrc = imgDom.querySelector('a').getAttribute('href');
        imgDom.append(createDynamicMediaPicture(dynamicImgSrc, 'card-grid-img'));
        imgDom.children[0].remove();
      }
    }

    if (subtitleDom) {
      subtitleDom.classList.add('item-subtitle');
      itemTextBoxEl.append(subtitleDom);
    }

    if (titDom) {
      titDom.classList.add('item-title');
      itemTextBoxEl.append(titDom);
    }

    if (textDom) {
      textDom.classList.add('item-text');
      itemTextBoxEl.append(textDom);
    }

    child.append(itemTextBoxEl);
    featureItemsWrapperEl.append(child);
  });

  if (block.classList.contains('center') && featureItemsWrapperEl.children.length > 4) {
    featureItemsWrapperEl.classList.add('small-gap');
  }
  block.append(featureItemsWrapperEl);
}
