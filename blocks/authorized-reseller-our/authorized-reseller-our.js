export default function decorate(block) {
  try {
    const elementItems = [...block.children];

    if (elementItems.length > 0) {
      elementItems[0]?.classList.add('ar-our-title');
    }

    const itemElements = elementItems.slice(1);

    for (let i = 0; i < itemElements.length; i += 4) {
      const groupContainer = document.createElement('div');
      groupContainer.classList.add('ar-our-group');

      const groupItems = itemElements.slice(i, i + 4);

      groupItems.forEach((element) => {
        element?.classList.add('ar-our-item');
        const [logo] = element.children;
        logo?.classList?.add('ar-our-item-logo');

        groupContainer.appendChild(element);
      });

      if (groupContainer.children.length > 0) {
        block.appendChild(groupContainer);
      }
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Authorized Reseller Our block decoration error:', error);
  }
}
