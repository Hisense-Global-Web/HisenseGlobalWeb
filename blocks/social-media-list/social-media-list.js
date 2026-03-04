import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  // social-media-list-item
  // const isEditMode = block.hasAttribute('data-aue-resource');
  // if (isEditMode) {
  //   return;
  // }
  const config = readBlockConfig(block);
  [...block.children].forEach((row) => {
    if (row.children[0].textContent?.trim() === 'title') {
      row.style.display = 'none';
      return;
    }
    row.classList.add('social-media-list-item');
    row.children[0].classList.add('social-media-list-item-img');
    row.children[1].classList.add('social-media-list-item-link');
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = e.currentTarget.textContent?.trim();
    });
  });

  if (config.title) {
    let titleEl = block.parentNode.querySelector('.share-title');
    if (!titleEl) {
      titleEl = document.createElement('div');
      titleEl.classList.add('share-title');
      block.parentNode.prepend(titleEl);
    }
    titleEl.innerHTML = config.title;
  }
}
