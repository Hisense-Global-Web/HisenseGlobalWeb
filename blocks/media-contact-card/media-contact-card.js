import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  [...block.children].forEach((row) => {
    if (row.children[0].textContent?.trim() === 'title') {
      row.style.display = 'none';
      return;
    }
    row.classList.add('media-contact-card-item');
    const btnGroupEl = document.createElement('div');
    btnGroupEl.classList.add('media-contact-card-group');
    [...row.children].forEach((child, i) => {
      if (i === 1) {
        const btnEl = document.createElement('div');
        btnEl.classList.add('media-contact-card-btn');
        btnEl.innerHTML = child.textContent.trim();
        btnGroupEl.append(btnEl);
        child.remove();
      } else if (i === 2) {
        const btnEl = btnGroupEl.querySelector('.media-contact-card-btn');
        if (btnEl && child.textContent.trim()) {
          btnEl.addEventListener('click', () => {
            window.location.href = child.textContent.trim();
          });
        }
        child.remove();
      } else if (i === 3) {
        if (child.textContent.trim()) {
          const descriptionEl = document.createElement('div');
          descriptionEl.classList.add('media-contact-card-description');
          descriptionEl.innerHTML = child.textContent.trim();
          btnGroupEl.append(descriptionEl);
        }
        child.remove();
      } else {
        child.classList.add('media-contact-card-richtext');
      }
    });
    row.appendChild(btnGroupEl);
  });

  if (config.title) {
    const titleEl = document.createElement('div');
    titleEl.classList.add('share-title');
    titleEl.innerHTML = config.title;
    block.parentNode.prepend(titleEl);
  }
}
