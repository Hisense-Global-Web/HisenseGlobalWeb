import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  try {
    const elementItems = [...block.children];

    const textContainer = document.createElement('div');
    textContainer.classList.add('product-information-text');

    elementItems.forEach((element, index) => {
      if (index === 0) {
        element.style.display = 'none';
      } else if (index === 1) {
        if (element.querySelector('a')) {
          const aEl = element.querySelector('a');
          aEl.style.display = 'none';
          const { href } = aEl;
          element.append(createDynamicMediaPicture(href));
        }
        element?.classList.add('product-information-image');
      } else if (index === 2) {
        element?.classList.add('product-information-subtitle');
        textContainer.appendChild(element);
      } else if (index === 3) {
        element?.classList.add('product-information-title');
        textContainer.appendChild(element);
      }
    });
    if (textContainer.children.length > 0) {
      block.appendChild(textContainer);
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Product Info block decoration error:', error);
  }
}
