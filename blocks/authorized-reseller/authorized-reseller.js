export default function decorate(block) {
  console.log('===== authorized-reseller block decoration', block);

  try {
    const elementItems = [...block.children];

    const textContainer = document.createElement('div');
    textContainer.classList.add('authorized-reseller-header-text');

    const listContainer = document.createElement('div');
    listContainer.classList.add('authorized-reseller-list');

    elementItems.forEach((element, index) => {
      if (index === 0) {
        element?.classList.add('authorized-reseller-header-icon');
      } else if (index === 1) {
        element?.classList.add('authorized-reseller-header-title');
        textContainer.appendChild(element);
      } else if (index === 2) {
        element?.classList.add('authorized-reseller-header-subtitle');
        
        // 为 subtitle 下第二个 div 中的 p 标签添加 title 属性
        const divElements = element.querySelectorAll('div');
        if (divElements.length >= 2) {
          const secondDiv = divElements[1];
          const pElement = secondDiv.querySelector('p');
          if (pElement) {
            pElement.setAttribute('title', pElement.textContent || pElement.innerText);
          }
        }

        textContainer.appendChild(element);
      } else {
        element?.classList.add('authorized-reseller-header-item');
        
        const [icon, title] = element.children;
        icon?.classList?.add('authorized-reseller-item-icon');
        title?.classList?.add('authorized-reseller-item-title');

        const pElement = title.querySelector('p');
        if (pElement) {
          pElement.setAttribute('title', pElement.textContent || pElement.innerText);
        }

        listContainer.appendChild(element);
      }

    });
    if (textContainer.children.length > 0) {
      block.appendChild(textContainer);
    }
    if (listContainer.children.length > 0) {
      block.appendChild(listContainer);
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Addional Support Card block decoration error:', error);
  }
}
