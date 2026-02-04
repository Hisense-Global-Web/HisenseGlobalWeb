import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  try {
    // const [title, subtitle] = block.querySelectorAll('p');
    // title.classList.add('section-title-title');
    // if (subtitle.innerHTML.trim() === '') {
    //   subtitle.remove();
    // } else {
    //   subtitle.classList.add('section-title-subtitle');
    // }
    /* eslint-disable-next-line no-console */
    console.log(readBlockConfig(block));
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Section Title block decoration error:', error);
  }
}
