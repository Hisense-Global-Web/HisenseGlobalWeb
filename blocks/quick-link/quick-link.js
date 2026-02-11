import { readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  const title = config.title || 'Quick Links';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'quick-link-title';
  titleDiv.textContent = title;

  const ul = document.createElement('ul');
  ul.className = 'quick-link-list';

  const rows = [...block.children];
  rows.forEach((row) => {
    if (row.children.length < 2) return;

    const li = document.createElement('li');
    const a = document.createElement('a');
    moveInstrumentation(row, li);

    // Extract text, link, and target from cells
    const cells = [...row.children];
    const textCell = cells[0];
    const linkCell = cells[1];
    const targetCell = cells[2];

    const link = linkCell ? linkCell.querySelector('a') : null;
    a.href = link ? link.href : '#';
    a.textContent = textCell ? textCell.textContent.trim() : '';

    // Set target attribute
    const target = targetCell ? targetCell.textContent.trim() : '_self';
    if (target === '_blank') {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }

    li.append(a);
    ul.append(li);
  });

  block.replaceChildren(titleDiv, ul);
}
