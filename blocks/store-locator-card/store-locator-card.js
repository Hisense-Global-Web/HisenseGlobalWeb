// import { decorateStoreLocatorSection } from '../../scripts/aem.js';
import { loadSection } from '../../scripts/aem.js';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    const storeLocatorSections = block.closest('.store-locator-container');
    if (storeLocatorSections) {
      // decorateStoreLocatorSection(storeLocatorSections);
      loadSection(storeLocatorSections);
    }
  }
}
