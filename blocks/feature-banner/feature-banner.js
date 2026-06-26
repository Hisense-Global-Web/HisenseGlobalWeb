// import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';
export default function decorate(block) {
  // const [dynamicSwitch, featurePcImg, featureMobileImg] = [...block.children] ?? [];
  // const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
  // dynamicSwitch.remove();

  // if (featurePcImg) {
  //   featurePcImg.className = 'feature-pc-img';
  //   if (featurePcImg.querySelector('a') && isDynamicFlag) {
  //     // 容错判断（兼容之前没有设置dynamic media 的组件）
  //     const dynamicImgSrc = featurePcImg.querySelector('a').getAttribute('href');
  //     featurePcImg.append(createDynamicMediaPicture(dynamicImgSrc, 'feature-banner'));
  //     featurePcImg.children[0].remove();
  //   }
  // }

  // if (featureMobileImg) {
  //   featureMobileImg.className = 'feature-mobile-img';
  //   if (isDynamicFlag) {
  //     const cloneFeaturePcImg = featurePcImg.cloneNode(true);
  //     cloneFeaturePcImg.className = 'feature-mobile-img';
  //     block.append(cloneFeaturePcImg);
  //     featureMobileImg.remove();
  //   }
  // }
  [...block.children].forEach((row, idx) => {
    if (idx === 0) {
      row.className = 'feature-pc-img';
    } else {
      row.className = 'feature-mobile-img';
    }
  });
}
