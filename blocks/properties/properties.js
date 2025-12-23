export default async function decorate(block) {
  const children = Array.from(block.children);
  const contentContainer = document.createElement('div');
  const headerButton = document.createElement('button');

  // Use destructuring for better readability
  const [firstItem, secondItem, ...propertyItems] = children;

  // Process header from first item
  if (firstItem) {
    const titleElement = firstItem.querySelector('div p');
    if (titleElement) {
      const title = document.createElement('h3');
      title.className = 'accordion-title';
      title.textContent = titleElement.textContent;

      // Create icon
      const icon = document.createElement('span');
      icon.className = 'accordion-icon';
      const iconImg = document.createElement('img');
      iconImg.src = '/icons/chevron-up.svg';
      iconImg.setAttribute('aria-hidden', 'true');
      iconImg.loading = 'lazy';
      icon.appendChild(iconImg);

      // Build header button
      headerButton.className = 'accordion-header';
      headerButton.append(title, icon);
    }
  }

  // Check if expanded by default
  const expandedByDefault = secondItem?.textContent.trim().toLowerCase() === 'true';

  // Process property items
  propertyItems.forEach((item) => {
    item.classList.add('property-item');
    const firstDiv = item.querySelector('div:first-child');
    if (firstDiv) {
      firstDiv.classList.add('property-item-name');
    }
    contentContainer.appendChild(item);
  });

  // Clear and rebuild block
  // block.innerHTML = '';
  block.replaceChildren(headerButton, contentContainer);
  contentContainer.className = 'accordion-content';

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
