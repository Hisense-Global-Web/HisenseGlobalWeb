export default async function decorate(block) {
  const cardNavigationWrapperEl = document.createElement('div');
  cardNavigationWrapperEl.className = 'card-navigation-wrapper';

  [...block.children].forEach((row) => {
    row.className = 'card-box';
    cardNavigationWrapperEl.append(row);
    [...row.children].forEach((column, colIndex) => {
      switch (colIndex) {
        case 0:
          column.className = 'card-image-box';
          break;
        case 1:
          column.className = 'card-title';
          if (column.children.length === 2) column.lastElementChild.className = 'title-unit';
          break;
        default:
          column.className = 'card-description';
          break;
      }
    });
  });
  block.append(cardNavigationWrapperEl);
}
