export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    return;
  }
  const ArticleBodyDiv = document.createElement('div');
  [...block.children].forEach((row) => {
    const type = row.firstElementChild?.textContent?.trim() || '';
    if (type === 'headline') {
      const headlineContent = row.children[1]?.textContent?.trim() || '';
      const headlineDiv = document.createElement('div');
      headlineDiv.className = 'text-body-headerline';
      headlineDiv.innerHTML = headlineContent;
      ArticleBodyDiv.append(headlineDiv);
    } else if (type === 'image') {
      const imgEl = row.querySelector('img');
      const imgSrc = imgEl?.src || '';
      const imgAlt = row.children[2]?.textContent?.trim() || '';
      const imageDiv = document.createElement('div');
      imageDiv.className = 'text-body-image';
      imageDiv.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
      ArticleBodyDiv.append(imageDiv);
    } else if (type === 'content') {
      const contentDiv = row.children[1];
      contentDiv.className = 'text-body-content';
      ArticleBodyDiv.append(contentDiv);
    } else if (type === 'quote') {
      const quoteDiv = row.children[1];
      quoteDiv.className = 'text-body-quote';
      const imgEl = document.createElement('img');
      imgEl.className = 'quotation';
      imgEl.src = '/content/dam/hisense/us/common-icons/quotation.svg';
      imgEl.alt = 'quotation';
      quoteDiv.append(imgEl);
      const notesDiv = row.children[2];
      if (notesDiv) {
        notesDiv.className = 'text-body-quote-notes';
        quoteDiv.append(notesDiv);
      }
      ArticleBodyDiv.append(quoteDiv);
    } else if (type === 'flexend-side-by-side') {
      const GroupDiv = document.createElement('div');
      GroupDiv.className = 'text-body-group-flexend';
      // 图
      const imgGroupDiv = document.createElement('div');
      const imgEl = row.querySelector('img');
      imgGroupDiv.className = 'text-body-img-group';
      imgGroupDiv.append(imgEl);
      // 文
      const textGroupDiv = document.createElement('div');
      const title = row.children[2] || '';
      title.className = 'text-body-title';
      const desc = row.children[3] || '';
      desc.className = 'text-body-desc';
      textGroupDiv.className = 'text-body-text-group';
      textGroupDiv.append(title, desc);
      if (imgEl) {
        GroupDiv.append(imgGroupDiv);
      }
      GroupDiv.append(textGroupDiv);
      ArticleBodyDiv.append(GroupDiv);
    } else {
      ArticleBodyDiv.append(row);
    }
  });
  block.replaceChildren(...ArticleBodyDiv.children);
}
