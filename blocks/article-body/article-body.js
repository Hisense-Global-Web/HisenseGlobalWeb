import wrapInRichtext from '../../utils/wrap-in-richtext.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const typeColumn = row.firstElementChild;
    const type = typeColumn?.textContent?.trim() || '';

    if (type === 'headline') {
      const headlineContent = row.children[1]?.textContent?.trim() || '';
      const headlineDiv = document.createElement('div');
      headlineDiv.className = 'text-body-headerline';
      headlineDiv.innerHTML = headlineContent;

      // Hide the original row and append the new element after it
      row.style.display = 'none';
      row.insertAdjacentElement('afterend', headlineDiv);
    } else if (type === 'image') {
      const imgEl = row.querySelector('img');
      const imgSrc = imgEl?.src || '';
      const imgAlt = row.children[2]?.textContent?.trim() || '';
      const imageDiv = document.createElement('div');
      imageDiv.className = 'text-body-image';
      imageDiv.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;

      row.style.display = 'none';
      row.insertAdjacentElement('afterend', imageDiv);
    } else if (type === 'content') {
      const contentDiv = row.children[1];
      contentDiv.className = 'text-body-content';

      row.style.display = 'none';
      row.insertAdjacentElement('afterend', contentDiv);
    } else if (type === 'quote') {
      const quoteDiv = row.children[1];
      quoteDiv.className = 'text-body-quote';
      const imgEl = document.createElement('img');
      imgEl.className = 'quotation';
      imgEl.src = `/content/dam/hisense/${country}/common-icons/quotation.svg`;
      imgEl.alt = 'quotation';
      quoteDiv.insertBefore(imgEl, quoteDiv.firstChild);

      const notesDiv = row.children[2];
      if (notesDiv) {
        notesDiv.className = 'text-body-quote-notes';
        quoteDiv.appendChild(notesDiv);
      }

      row.style.display = 'none';
      row.insertAdjacentElement('afterend', quoteDiv);
    } else if (type === 'flexend-side-by-side') {
      const GroupDiv = document.createElement('div');
      GroupDiv.className = 'text-body-group-flexend';
      // 图
      const imgGroupDiv = document.createElement('div');
      const imgEl = row.querySelector('img');
      if (imgEl) {
        imgGroupDiv.className = 'text-body-img-group';
        imgGroupDiv.appendChild(imgEl);
        GroupDiv.appendChild(imgGroupDiv);
      }

      // 文
      const textGroupDiv = document.createElement('div');
      const title = row.children[2];
      const desc = row.children[3];

      if (title) {
        title.className = 'text-body-title';
      }
      if (desc) {
        desc.className = 'text-body-desc';
      }
      textGroupDiv.className = 'text-body-text-group';
      if (title) textGroupDiv.appendChild(title);
      if (desc) textGroupDiv.appendChild(desc);
      GroupDiv.appendChild(textGroupDiv);

      row.style.display = 'none';
      row.insertAdjacentElement('afterend', GroupDiv);
    } else {
      // For unknown types, just hide the type column but keep the content
      // eslint-disable-next-line no-lonely-if
      if (typeColumn) {
        typeColumn.style.display = 'none';
      }
    }
  });
  // Remove all hidden rows from the DOM
  const hiddenRows = block.querySelectorAll('[style*="display: none"]');
  hiddenRows.forEach((row) => row.remove());

  wrapInRichtext(block);
}
