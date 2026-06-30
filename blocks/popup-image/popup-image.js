import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  [...block.children].forEach((child) => {
    child.setAttribute('class', child.firstElementChild.textContent);
    child.firstElementChild.remove();
  });
  const [dynamicSwitch, popupImgDom] = [...block.children] ?? [];
  const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
  dynamicSwitch.remove();
  if (isDynamicFlag && popupImgDom.querySelector('a')) {
    // 设置dynamic media
    const dynamicImgSrc = popupImgDom.querySelector('a').getAttribute('href');
    popupImgDom.append(createDynamicMediaPicture(dynamicImgSrc, 'popup-image'));
    popupImgDom.children[0].remove();
  }
}
