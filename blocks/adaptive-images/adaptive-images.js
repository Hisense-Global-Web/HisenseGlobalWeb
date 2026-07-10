import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  const [dynamicSwitch, pcImageEl, mobileImageEl] = [...block.children] ?? [];
  const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true';
  dynamicSwitch.remove();

  if (pcImageEl) {
    pcImageEl.className = 'pc-image';
    if (pcImageEl.querySelector('a') && isDynamicFlag) {
      // 容错判断（兼容之前没有设置dynamic media 的组件）
      const dynamicImgSrc = pcImageEl.querySelector('a').getAttribute('href');
      pcImageEl.append(createDynamicMediaPicture(dynamicImgSrc, 'adaptive-images'));
      pcImageEl.children[0].remove();
    }
  }

  if (isDynamicFlag) {
    // 是dynamic media 的图片资源时，直接copy PC端的 img dom, 做为 mobile 的图片展示
    const clonePcImageEl = pcImageEl.cloneNode(true);
    clonePcImageEl.className = 'mobile-image';
    block.append(clonePcImageEl);
    mobileImageEl.remove();
  } else if (mobileImageEl) {
    mobileImageEl.className = 'mobile-image';
  }
}
