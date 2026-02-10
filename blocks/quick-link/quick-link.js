import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const titleDiv = document.createElement('div');
  titleDiv.className = 'quick-link-title';
  const ul = document.createElement('ul');
  ul.className = 'quick-link-list';

  rows.forEach((row, i) => {
    if (i === 0) {
      // First row is the title (parent field)
      moveInstrumentation(row, titleDiv);
      while (row.firstElementChild) titleDiv.append(row.firstElementChild);
    } else {
      // Subsequent rows are link items (child items)
      const li = document.createElement('li');
      const a = document.createElement('a');
      moveInstrumentation(row, li);
      const link = row.querySelector('a');
      a.href = link ? link.href : '#';
      a.textContent = row.textContent.trim();
      li.append(a);
      ul.append(li);
    }
  });

  block.replaceChildren(titleDiv, ul);
}
