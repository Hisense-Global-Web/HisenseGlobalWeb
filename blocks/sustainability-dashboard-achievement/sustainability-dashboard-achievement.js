import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  console.log(config,block);
  
  // const config = ['title', 'value', 'description'];
  // [...block.children].forEach((child) => {
  //   child.classList.add('sustainability-dashboard-list-item');
  //   [...child.children].forEach((grandChild, index) => {
  //     grandChild.classList.add(config[index]);
  //   });
  // });
}