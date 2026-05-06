import { getLocaleFromPath } from '../../scripts/locale-utils.js';

export default function decorate(block) {
  const { country } = getLocaleFromPath();
  document.documentElement.style.setProperty('--nav-height', '100px');
  const ulEl = document.createElement('ul');
  const blockPNode = block.closest('.sitemap-wrapper');
  if (blockPNode) {
    blockPNode.classList.add('hide');
    blockPNode.parentNode.children[0].classList.remove('hide');
  }
  [...block.children].forEach((row, index) => {
    if (!index) {
      row.classList.add('sitemap-title');
      const img = document.createElement('img');
      img.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
      img.addEventListener('click', (e) => {
        const pNode = e.currentTarget.closest('.sitemap-wrapper');
        pNode.classList.toggle('hide');
      });
      row.append(img);
    } else {
      const liEl = document.createElement('li');
      liEl.classList.add('sitemap-item');
      const aEl = row.querySelector('a');
      aEl.textContent = row.children[0].textContent.trim();
      liEl.append(aEl);
      row.style.display = 'none';
      ulEl.appendChild(liEl);
    }
  });
  block.appendChild(ulEl);
}
