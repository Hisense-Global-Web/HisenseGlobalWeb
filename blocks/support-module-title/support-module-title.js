import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  try {
    const config = readBlockConfig(block);
    const textStyle = config['txt-style'] || 'left';
    const isCenter = textStyle === 'center';
    const [textStyleEl, titleEl, subtitleEl] = block.querySelectorAll('p');
    textStyleEl?.remove();
    titleEl.classList.add('support-module-title-title');
    if (isCenter) {
      titleEl.classList.add('text-center');
    }
    // If subtitle exists
    if (subtitleEl) {
      // Check if subtitle is empty
      if (subtitleEl?.innerHTML?.trim() === '') {
        subtitleEl.remove();
      } else {
        subtitleEl.classList.add('support-module-title-subtitle');
        if (isCenter) {
          subtitleEl.classList.add('text-center');
        }
      }
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Section Title block decoration error:', error);
  }
}
