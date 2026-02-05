export default async function decorate(block) {
  const featureItemsWrapperEl = document.createElement('div');
  featureItemsWrapperEl.className = 'feature-items-wrapper';
  // const itemTextBoxEl = document.createElement('div');
  // itemTextBoxEl.className = 'item-text-box';
  [...block.children].forEach((child) => {
    child.className = 'feature-item-box';
    // child.firstElementChild.className = 'item-img-box';

    // const secondChild = child.children[1];
    // secondChild.className = 'item-text-box';
    // secondChild.firstElementChild.className = 'item-subtitle';
    // secondChild.querySelector('p:nth-child(2)').className = 'item-title';
    // secondChild.querySelector('p:nth-child(3)').className = 'item-text';
    // featureItemsWrapperEl.append(child);
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
