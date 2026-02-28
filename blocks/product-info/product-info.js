export default function decorate(block) {
  try {
    const elementItems = [...block.children];

    const textContainer = document.createElement('div');
    textContainer.classList.add('product-info-text');

    elementItems.forEach((element, index) => {
      if (index === 0) {
        element?.classList.add('product-info-image');
      } else if (index === 1) {
        element?.classList.add('product-info-subtitle');
        textContainer.appendChild(element);
      } else if (index === 2) {
        element?.classList.add('product-info-title');
        textContainer.appendChild(element);
      }
    });
    if (textContainer.children.length > 0) {
      block.appendChild(textContainer);
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Authorized Reseller Note block decoration error:', error);
  }
}
