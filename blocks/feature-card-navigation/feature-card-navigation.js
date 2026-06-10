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
        case 2:
          column.className = 'card-description';
          break;
        default:
          column.className = 'card-step';
          break;
      }
    });
  });

  block.append(cardNavigationWrapperEl);

  // 获取所有需要调整的卡片（如果有多个）
  const cards = block.querySelectorAll('.card-box');

  cards.forEach((card) => {
    const stepElement = card.querySelector('.card-step');
    const titleElement = card.querySelector('.card-title');

    if (stepElement && stepElement.textContent.trim()) {
      // 如果 card-step 有值，则调整 title、description 样式
      card.classList.add('step-card-box');
      // 将 step 移动到 title 前面
      card.insertBefore(stepElement, titleElement);
    } else {
      card.classList.remove('step-card-box');
    }
  });
}
