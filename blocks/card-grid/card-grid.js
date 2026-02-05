export default async function decorate(block) {
  const featureItemsWrapperEl = document.createElement('div');
  featureItemsWrapperEl.className = 'feature-items-wrapper';
  // [...block.children].forEach((child) => {
  //   child.className = 'feature-item-box';
  //   child.firstElementChild.className = 'item-img-box';
  //   const secondChild = child.children[1];
  //   secondChild.className = 'item-text-box';
  //   secondChild.firstElementChild.className = 'item-subtitle';
  //   secondChild.querySelector('p:nth-child(2)').className = 'item-title';
  //   secondChild.querySelector('p:nth-child(3)').className = 'item-text';
  //   featureItemsWrapperEl.append(child);
  // });
  // block.append(featureItemsWrapperEl);
}
