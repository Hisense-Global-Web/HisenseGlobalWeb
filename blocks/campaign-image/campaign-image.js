import { getSwitchValue } from '../../utils/ue-helper.js';
import { checkDyanmicMediaImage } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  const [enableDynamicMediaEl, pcImageEl, mobileImageEl] = [...block.children] ?? [];
  const isEnableDynamicMedia = getSwitchValue(enableDynamicMediaEl);
  enableDynamicMediaEl?.remove();
  const dynamicPCImageEl = checkDyanmicMediaImage(pcImageEl);
  if (isEnableDynamicMedia) {
    const cloneDynamicImageEl = dynamicPCImageEl.cloneNode(true);
    dynamicPCImageEl.className = 'pc-image';
    block.append(dynamicPCImageEl);
    cloneDynamicImageEl.className = 'mobile-image';
    block.append(cloneDynamicImageEl);
    mobileImageEl?.remove();
  } else {
    if (dynamicPCImageEl) {
      dynamicPCImageEl.className = 'pc-image';
    }
    if (mobileImageEl) {
      mobileImageEl.className = 'mobile-image';
    }
  }
}
