import { processPath } from '../../utils/carousel-common.js';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    return;
  }
  let showButton = false;
  [...block.children].forEach((row, index) => {
    if (index === 0) {
      row.classList.add('collapse-title');
    } else if (index === 1) {
      row.classList.add('collapse-context');
    } else if (index === 2) {
      if (row.textContent.trim() === 'true') {
        showButton = true;
      }
      row.remove();
    } else if (index === 3) {
      const btnEl = document.createElement('div');
      btnEl.classList.add('collapse-btn');
      if (showButton) {
        btnEl.textContent = row.querySelectorAll('p')[0].textContent;
        btnEl.addEventListener('click', () => {
          const originalHref = row.querySelectorAll('p')[1].querySelector('a').href;
          window.location.href = processPath(originalHref);
        });
      } else {
        btnEl.classList.add('hide');
      }
      const contextEl = block.querySelector('.collapse-context');
      contextEl.appendChild(btnEl);
      row.remove();
    }
  });
}
