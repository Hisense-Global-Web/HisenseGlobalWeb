import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  const [dynamicSwitch, featurePcImg, featureMobileImg] = [...block.children] ?? [];
  const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
  dynamicSwitch.remove();

  if (featurePcImg) {
    featurePcImg.className = 'feature-pc-img';
    if (featurePcImg.querySelector('a') && isDynamicFlag) {
      // 容错判断（兼容之前没有设置dynamic media 的组件）
      const dynamicImgSrc = featurePcImg.querySelector('p a').getAttribute('href');
      featurePcImg.querySelector('p').append(createDynamicMediaPicture(dynamicImgSrc, 'feature-banner'));
      featurePcImg.querySelector('p').children[0].remove();
    }
  }

  if (featureMobileImg) {
    featureMobileImg.className = 'feature-mobile-img';
    if (isDynamicFlag) {
      const cloneFeaturePcImg = featurePcImg.querySelector('p').cloneNode(true);
      cloneFeaturePcImg.className = 'feature-mobile-img';
      block.append(cloneFeaturePcImg);
      featureMobileImg.remove();
    }
  }
}
