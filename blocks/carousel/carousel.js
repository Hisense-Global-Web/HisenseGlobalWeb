export default async function decorate(block) {
  // carousel block
  const rows = block.querySelectorAll(':scope > div');
  const wholeContainer = document.createElement('ul');
  wholeContainer.classList.add('whole-container');
  if (rows.length > 0) {
    rows.forEach((row, index) => {
      row.classList.add('single-container');
      row.classList.add(`content-${index}`);
      wholeContainer.appendChild(row);
    });
  }
  block.prepend(wholeContainer);
}
