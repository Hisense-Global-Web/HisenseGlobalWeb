import { isUniversalEditor } from '../../utils/ue-helper.js';

export default async function decorate(block) {
  const children = Array.from(block.children);
  const contentContainer = document.createElement('div');
  const headerButton = document.createElement('button');

  const [firstItem, ...propertyItems] = children;

  // Process header from first item
  if (firstItem) {
    const titleElement = firstItem.querySelector('div p');
    if (titleElement) {
      const title = document.createElement('h3');
      title.className = 'properties-header-title';
      title.textContent = titleElement.textContent;

      // Create icon
      const icon = document.createElement('span');
      icon.className = 'properties-header-icon';
      const iconImg = document.createElement('img');
      iconImg.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
      iconImg.setAttribute('aria-hidden', 'true');
      iconImg.loading = 'lazy';
      icon.appendChild(iconImg);

      // Build header button
      headerButton.className = 'properties-header';
      headerButton.append(title, icon);
    }
  }

  // Check if expanded by default
  let expandedByDefault = isUniversalEditor();

  // Process property items
  propertyItems.forEach((item) => {
    if (item.children.length === 1) {
      expandedByDefault = isUniversalEditor() || item.querySelector('div')
        ?.textContent
        .trim()
        .toLowerCase() === 'true';
      return;
    }
    item.classList.add('property');
    const firstDiv = item.querySelector('div:first-child');
    if (firstDiv) {
      firstDiv.classList.add('property-name');
      contentContainer.appendChild(item);
    }
  });

  // Clear and rebuild block
  block.replaceChildren(headerButton, contentContainer);
  contentContainer.className = 'properties-content';

  // Set initial state
  if (expandedByDefault) {
    block.classList.add('expanded');
  }

  // Toggle click handler
  if (headerButton) {
    headerButton.addEventListener('click', () => {
      block.classList.toggle('expanded');
    });
  }

  // Add first/last classes to all properties blocks
  const propertiesBlocks = document.querySelectorAll('.block.properties');
  if (propertiesBlocks.length > 0) {
    propertiesBlocks[0].classList.add('first');
    propertiesBlocks[propertiesBlocks.length - 1].classList.add('last');
  }
}
