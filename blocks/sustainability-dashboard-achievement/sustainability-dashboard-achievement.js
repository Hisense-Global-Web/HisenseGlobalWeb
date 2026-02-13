import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  console.log(config, block);
  [...block.children].forEach((child) => {
    console.log(child);
    if (child.textContent.includes('matrix')) {
      block.append(...child.children);
    }
    if (Object.keys(config).includes(child.firstElementChild?.textContent.trim().toLowerCase())) {
      child.classList.add(child.firstElementChild?.textContent.trim());
      child.firstElementChild.remove();
    }
  });
  // const config = ['title', 'value', 'description'];
  // [...block.children].forEach((child) => {
  //   child.classList.add('sustainability-dashboard-list-item');
  //   [...child.children].forEach((grandChild, index) => {
  //     grandChild.classList.add(config[index]);
  //   });
  // });
}
