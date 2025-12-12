export default async function decorate(block) {
  // carousel block
  const rows = block.querySelectorAll(':scope > div');
  const wholeContainer = document.createElement('div');
  wholeContainer.classList.add('wholeContainer');
  if (rows.length > 0) {
    rows.forEach((row) => {
      wholeContainer.appendChild(row);
    });
  }
  block.prepend(wholeContainer);
}
