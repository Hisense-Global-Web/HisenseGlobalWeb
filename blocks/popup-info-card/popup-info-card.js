import { getLocaleFromPath } from '../../scripts/locale-utils.js';

export default function decorate(block) {
  const { country } = getLocaleFromPath();
  [...block.children].forEach((item) => {
    item.classList = 'info-card-item';
    const columns = [...item.children];
    columns.forEach((col, index) => {
      switch (index) {
        case 0: {
          col.classList = 'card-image';
          if (!col.querySelector('img')) {
            const defaultImg = document.createElement('img');
            defaultImg.src = `/content/dam/hisense/${country}/common-icons/default-info-card.png`;
            defaultImg.alt = 'default-info-card-img';
            col.append(defaultImg);
          }
          break;
        }
        case 1: {
          col.classList = 'card-description';
          const [title, text] = [...col.children];
          title.classList = 'card-tit';
          text.classList = 'card-text';
          break;
        }
        default:
          break;
      }
    });
  });
}
