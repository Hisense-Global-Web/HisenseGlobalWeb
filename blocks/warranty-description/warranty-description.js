import { handleCommonDownloadClick } from '../../utils/download.js';

export default async function decorate(block) {
  [...block.children].forEach((item, index) => {
    if (index === 0) {
      item.className = 'des-title';
    } else if (index === 1) {
      item.className = 'des-subtitle';
    } else if (index === 2) {
      item.className = 'des-body';
    } else {
      item.className = 'button-box';
      const pAll = item.querySelectorAll('p');
      const downloadLink = pAll[0]?.querySelector('a')?.href || pAll[0]?.querySelector('img')?.src || '';
      pAll[0].remove();
      if (pAll[1]) {
        pAll[1].className = 'des-button';
        item.addEventListener('click', (e) => {
          e.preventDefault();
          handleCommonDownloadClick(downloadLink);
        });
      }
    }
  });
  const title = block.querySelector('.des-title')?.textContent.trim();
  const subtitle = block.querySelector('.des-subtitle')?.textContent.trim();
  if (title && subtitle) {
    block.querySelector('.des-subtitle').classList.add('has-title');
  }
}
