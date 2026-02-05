import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  [...block.children].forEach((child) => {
    child.setAttribute('class', child.firstElementChild.textContent);
    child.firstElementChild.remove();
  });
}
