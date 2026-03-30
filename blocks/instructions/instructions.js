import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  [...block.children].forEach((child) => {
    if (Object.keys(config).includes(child.firstElementChild?.textContent.trim().toLowerCase())) {
      child.className = child.firstElementChild?.textContent.trim();
      child.firstElementChild.remove();
    }
  });
}
