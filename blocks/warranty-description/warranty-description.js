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
      let downloadLink = '';
      [...item.children].forEach((itemChild) => {
        [...itemChild.children].forEach((btnChild, btnIdx) => {
          if (btnIdx === 0) {
            downloadLink = btnChild.querySelector('a')?.href || btnChild.querySelector('img')?.src || '';
            btnChild.remove();
          } else {
            btnChild.className = 'des-button';
            btnChild.addEventListener('click', (e) => {
              e.preventDefault();
              handleCommonDownloadClick(downloadLink);
            });
          }
        });
      });
    }
  });
  const title = block.querySelector('.des-title')?.textContent.trim();
  const subtitle = block.querySelector('.des-subtitle')?.textContent.trim();
  if (title && subtitle) {
    block.querySelector('.des-subtitle').classList.add('has-title');
  }
}
