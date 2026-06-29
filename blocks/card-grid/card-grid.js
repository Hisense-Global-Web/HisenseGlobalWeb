import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default async function decorate(block) {
  const featureItemsWrapperEl = document.createElement('div');
  featureItemsWrapperEl.className = 'feature-items-wrapper';

  [...block.children].forEach((child) => {
    child.className = 'feature-item-box';
    const itemTextBoxEl = document.createElement('div');
    itemTextBoxEl.className = 'item-text-box';
    // [...child.children].forEach((item, itemIndex) => {
    //   switch (itemIndex) {
    //     case 0:
    //       item.className = 'item-img-box';
    //       break;
    //     case 1:
    //       item.classList.add('item-subtitle');
    //       itemTextBoxEl.append(item);
    //       break;
    //     case 2:
    //       item.classList.add('item-title');
    //       itemTextBoxEl.append(item);
    //       break;
    //     default:
    //       item.classList.add('item-text');
    //       itemTextBoxEl.append(item);
    //   }
    // });

    const [dynamicSwitch, imgDom, subtitleDom, titDom, textDom] = [...block.children] ?? [];
    const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
    dynamicSwitch.remove();

    if (imgDom) {
      imgDom.classList.add('item-img-box');
      if (isDynamicFlag && imgDom.querySelector('a')) {
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
