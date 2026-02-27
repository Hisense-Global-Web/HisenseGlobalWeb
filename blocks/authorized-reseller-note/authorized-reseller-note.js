export default function decorate(block) {
  try {
    const elementItems = [...block.children];

    const textContainer = document.createElement('div');
    textContainer.classList.add('ar-note-header-text');

    elementItems.forEach((element, index) => {
      if (index === 0) {
        element?.classList.add('ar-note-header-icon');
      } else if (index === 1) {
        element?.classList.add('ar-note-header-title');
        textContainer.appendChild(element);
      } else if (index === 2) {
        element?.classList.add('ar-note-header-content');
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
