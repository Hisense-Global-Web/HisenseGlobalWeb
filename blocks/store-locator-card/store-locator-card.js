// import { decorateStoreLocatorSection } from '../../scripts/aem.js';
// import { loadSection } from '../../scripts/aem.js';
import { generateStoreEl } from '../store-locator/store-locator.js';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    const { node } = generateStoreEl(block);
    if (node) {
      block.innerHTML = '';
      block.append([...node.children]);
    }
    // const storeLocatorSections = block.closest('.store-locator-container');
    // if (storeLocatorSections) {
    //   // decorateStoreLocatorSection(storeLocatorSections);
    //   loadSection(storeLocatorSections);
    // }
  }
}
