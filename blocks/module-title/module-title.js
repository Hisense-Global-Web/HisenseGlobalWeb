// import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  // console.log(readBlockConfig(block), 'readblockconfig');
  [...block.children].forEach((child) => {
    // console.log(child, 'eeee')
    child.setAttribute('class', child.firstElementChild.textContent);
    // console.log(child.firstElementChild.textContent, 'kkdfjdkfjdkfjkdjf')
    child.firstElementChild.remove();
  });
}
