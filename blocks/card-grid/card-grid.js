export default async function decorate(block) {
  const featureItemsWrapperEl = document.createElement('div');
  featureItemsWrapperEl.className = 'feature-items-wrapper';

  [...block.children].forEach((child) => {
    child.className = 'feature-item-box';
    const itemTextBoxEl = document.createElement('div');
    itemTextBoxEl.className = 'item-text-box';
    [...child.children].forEach((item, itemIndex) => {
      if (itemIndex > 0) {
        const type = item.firstElementChild?.textContent;
        item.classList.add(type);
        item.firstElementChild.remove();
        itemTextBoxEl.append(item);
      } else {
        item.className = 'item-img-box';
      }
    });

    child.append(itemTextBoxEl);
    featureItemsWrapperEl.append(child);
  });
  block.append(featureItemsWrapperEl);
}
