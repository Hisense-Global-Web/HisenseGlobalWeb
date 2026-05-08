export default async function decorate(block) {
  console.log('decorate warranty description', block);
  [...block.children].forEach((item, index) => {
    if (index === 0) {
      item.className = 'des-title';
    } else if (index === 1) {
      item.className = 'des-subtitle';
    } else if (index === 2) {
      item.className = 'des-body';
    } else {
      item.className = 'des-button';
      console.log('item', item);
      const pAll = item.querySelectorAll('p');
      const btnLabel = pAll[1].textContent.trim();
      if (btnLabel) {
        pAll[0].querySelector('a').textContent = btnLabel;
        pAll[1].remove();
      }
    }
  });
}
