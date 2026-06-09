import { getLocaleFromPath } from '../../scripts/locale-utils.js';

export default async function decorate(block) {
  const cardNavigationWrapperEl = document.createElement('div');
  cardNavigationWrapperEl.className = 'card-navigation-wrapper';
  const { language } = getLocaleFromPath();

  [...block.children].forEach((row) => {
    row.className = 'card-box';
    if (language === 'zh') {
      row.classList.add('zh-card-box');
    }
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

    // 确保两个元素都存在且在中文网站页面
    if (stepElement && titleElement && language === 'zh') {
      // 将 step 移动到 title 前面
      card.insertBefore(stepElement, titleElement);
    } else {
      // 步骤属性只在中文页面中展示
      stepElement.remove();
    }
  });
  // function moveCardStepBeforeTitle() {
  // // 获取所有需要调整的卡片（如果有多个）
  //   const cards = block.querySelectorAll('.zh-card-box');

  //   cards.forEach((card) => {
  //     const stepElement = card.querySelector('.card-step');
  //     const titleElement = card.querySelector('.card-title');

  //     // 确保两个元素都存在且在中文网站页面
  //     if (stepElement && titleElement) {
  //       // 将 step 移动到 title 前面
  //       card.insertBefore(stepElement, titleElement);
  //     }
  //   });
  // }
}
