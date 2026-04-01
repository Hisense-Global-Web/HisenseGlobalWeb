export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    return;
  }
  [...block.children].forEach((row, index) => {
    if (index === 0) {
      row.classList.add('pc-image');
    } else if (index === 1) {
      row.classList.add('mobile-image');
    }
  });
}
