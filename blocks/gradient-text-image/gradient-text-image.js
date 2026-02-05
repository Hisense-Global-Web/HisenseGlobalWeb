import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const textContainer = document.createElement('div');
  [...block.children].forEach((child) => {
    // avoid aem UE remove wrong
    if (Object.keys(config).includes(child.firstElementChild.textContent)) {
      child.setAttribute('class', child.firstElementChild.textContent);
      child.firstElementChild.remove();
    }
    if (child.querySelector('picture')) child.setAttribute('class', 'gradient-image');
    else textContainer.append(child);
  });
  textContainer.classList.add('text-container');
  block.append(textContainer);
}
