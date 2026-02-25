export default function decorate(block) {
  console.log('===== authorized-reseller block decoration', block);

  try {
    const elementItems = [...block.children];

    const listContainer = document.createElement('div');
    listContainer.classList.add('authorized-reseller-list');

    elementItems.forEach((element, index) => {
      if (index === 0) {
        element?.classList.add('authorized-reseller-header-icon');
      } else if (index === 1) {
        element?.classList.add('authorized-reseller-header-title');
      } else if (index === 2) {
        element?.classList.add('authorized-reseller-header-subtitle');
      } else {
        element?.classList.add('authorized-reseller-header-item');
        
        const [icon, title] = element.children;
        icon?.classList?.add('authorized-reseller-item-icon');
        title?.classList?.add('authorized-reseller-item-title');

        listContainer.appendChild(element);
      }

    });
    
    if (listContainer.children.length > 0) {
      block.appendChild(listContainer);
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Addional Support Card block decoration error:', error);
  }
}
