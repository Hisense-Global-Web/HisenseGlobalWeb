import { getSwitchValue } from '../../utils/ue-helper.js';
import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  const [enableDynamicMediaEl, pcImageEl, mobileImageEl] = [...block.children] ?? [];
  const isEnableDynamicMedia = getSwitchValue(enableDynamicMediaEl);
  enableDynamicMediaEl?.remove();
  if (isEnableDynamicMedia) {
    const dynamicImageUrl = pcImageEl.querySelector('a')?.href ?? null;
    if (dynamicImageUrl) {
      const dynamicImageEl = createDynamicMediaPicture(dynamicImageUrl, 'Campaign Image');
      dynamicImageEl.className = 'pc-image';
      block.append(dynamicImageEl);
      const cloneDynamicImageEl = dynamicImageEl.cloneNode(true);
      cloneDynamicImageEl.className = 'mobile-image';
      block.append(cloneDynamicImageEl);
    } else {
      /* eslint-disable-next-line no-console */
      console.warn('Dynamic image url is not found. Please check the image url.');
    }
    pcImageEl?.remove();
    mobileImageEl?.remove();
  } else {
    if (mobileImageEl) {
      mobileImageEl.className = 'mobile-image';
    }
    if (pcImageEl) {
      pcImageEl.className = 'pc-image';
    }
  }
}
