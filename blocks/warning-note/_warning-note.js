export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    return;
  }
  console.log(block);
  [...block.children].forEach((row, index) => {
    console.log(row, index);
    if (index === 0) {
      row.classList.add('note-title');
    } else if (index === 1) {
      row.classList.add('note-context');
    }
  });
}
