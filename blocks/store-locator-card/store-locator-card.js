// import { decorateStoreLocatorSection } from '../../scripts/aem.js';
// import { loadSection } from '../../scripts/aem.js';
import { generateStoreEl } from '../store-locator/store-locator.js';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    const { node } = generateStoreEl(block);
    const cloneNode = node?.cloneNode('true');
    if (cloneNode) {
      // block.append([...cloneNode.children]);
      if (cloneNode?.children?.length) {
        block.innerHTML = '';
        [...cloneNode.children].forEach((child) => {
          block.appendChild(child);
        });
      }
    }
    // const storeLocatorSections = block.closest('.store-locator-container');
    // if (storeLocatorSections) {
    //   // decorateStoreLocatorSection(storeLocatorSections);
    //   loadSection(storeLocatorSections);
    // }
  }
}
