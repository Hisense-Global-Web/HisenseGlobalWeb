import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');

  const rows = [...block.children];
  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    const resource = row.getAttribute('data-aue-resource') || null;
    const cells = [...row.children];
    if (cells.length < 2) return;

    const titleText = cells[0].textContent.trim();
    const tagsCsv = cells[1].textContent.trim();
    if (!titleText || !tagsCsv) return;

    const group = document.createElement('div');
    group.className = 'plp-filter-group';
    if (isEditMode && resource) {
      group.setAttribute('data-aue-resource', resource);
    }
    moveInstrumentation(row, group);

    const title = document.createElement('div');
    title.className = 'plp-filter-title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = titleText;
    const arrow = document.createElement('img');
    arrow.src = 'arrow.svg';
    title.append(titleSpan, arrow);

    const list = document.createElement('ul');
    list.className = 'plp-filter-list';

    const tags = tagsCsv.split(',').map((t) => t.trim()).filter(Boolean);
    tags.forEach((tagPath) => {
      const li = document.createElement('li');
      li.className = 'plp-filter-item';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = tagPath;
      input.setAttribute('data-option-value', tagPath);

      const label = document.createElement('span');
      const parts = tagPath.split('/');
      label.textContent = parts[parts.length - 1] || tagPath;

      li.append(input, label);
      list.append(li);
    });

    group.append(title, list);
    fragment.append(group);
  });
  const sidebar = document.createElement('aside');
  sidebar.className = 'plp-sidebar';
  sidebar.append(fragment);
  block.replaceChildren(sidebar);
}
