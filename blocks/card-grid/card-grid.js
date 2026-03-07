export default async function decorate(block) {
  const featureItemsWrapperEl = document.createElement('div');
  featureItemsWrapperEl.className = 'feature-items-wrapper';

  [...block.children].forEach((child) => {
    child.className = 'feature-item-box';
    const itemTextBoxEl = document.createElement('div');
    itemTextBoxEl.className = 'item-text-box';
    [...child.children].forEach((item, itemIndex) => {
      switch (itemIndex) {
        case 0:
          item.className = 'item-img-box';
          break;
        case 1:
          item.classList.add('item-subtitle');
          itemTextBoxEl.append(item);
          break;
        case 2:
          item.classList.add('item-title');
          itemTextBoxEl.append(item);
          break;
        default:
          item.classList.add('item-text');
          itemTextBoxEl.append(item);
      }
    });

    child.append(itemTextBoxEl);
    featureItemsWrapperEl.append(child);
  });
  block.append(featureItemsWrapperEl);
}
