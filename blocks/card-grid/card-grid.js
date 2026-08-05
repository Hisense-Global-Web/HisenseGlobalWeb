// import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default async function decorate(block) {
  const featureItemsWrapperEl = document.createElement('div');
  featureItemsWrapperEl.className = 'feature-items-wrapper';

  [...block.children].forEach((child) => {
    child.className = 'feature-item-box';
    const itemTextBoxEl = document.createElement('div');
    itemTextBoxEl.className = 'item-text-box mode-dark';

    const [imgDom, subtitleDom, titDom, textDom] = [...child.children] ?? [];
    // card image 暂时不需要同步 dynamic media, 先注释 ---20260724
    // const [dynamicSwitch, imgDom, subtitleDom, titDom, textDom] = [...child.children] ?? [];
    // const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
    // dynamicSwitch.remove();

    if (imgDom) {
      imgDom.classList.add('item-img-box');
      // card image 暂时不需要同步 dynamic media, 先注释 ---20260724
      // if (imgDom.querySelector('a')) {
      //   // 只要用户选择dynamic media, 即返回的是 a 标签，就获取其href 值， 显示图片，设置dynamic media 元素
      //   const dynamicImgSrc = imgDom.querySelector('a').getAttribute('href');
      //   imgDom.append(createDynamicMediaPicture(dynamicImgSrc, 'card-grid-img'));
      //   imgDom.children[0].remove();
      // }
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
