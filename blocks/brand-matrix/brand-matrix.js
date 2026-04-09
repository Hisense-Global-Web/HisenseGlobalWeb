export default async function decorate(block) {
  const brandMatrixWrapperEl = document.createElement('div');
  brandMatrixWrapperEl.className = 'brand-matrix-container';
  [...block.children].forEach((child) => {
    child.className = 'brand-matrix-item';
    brandMatrixWrapperEl.append(child);
    const row = [...child.children];
    const itemBackVal = row[0].textContent.split(',')[1]?.trim() || 'gradient-val';
    child.classList.add(itemBackVal);
    row.forEach((item, itemIndex) => {
      switch (itemIndex) {
        case 0:
          item.remove();
          break;
        case 1:
          item.className = 'brand-logo';
          break;
        default:
          break;
      }
    });
  });
  block.append(brandMatrixWrapperEl);
}
