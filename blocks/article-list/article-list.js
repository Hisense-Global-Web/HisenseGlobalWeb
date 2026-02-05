export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    const TitleEl = document.createElement('div');
    TitleEl.className = 'article-title-list-title';
    TitleEl.textContent = 'Key Facts';
    block.prepend(TitleEl);
    return;
  }
  const TitleEl = document.createElement('div');
  TitleEl.className = 'article-title-list-title';
  TitleEl.textContent = 'Key Facts';

  const AtBodyEl = document.createElement('div');
  AtBodyEl.className = 'article-body-list';
  [...block.children].forEach((row) => {
    row.classList.add('article-body-list-item');
    row.children[0]?.classList.add('article-body-list-item-title');
    row.children[1]?.classList.add('article-body-list-item-headline');
    AtBodyEl.append(row);
  });
  block.replaceChildren(TitleEl, AtBodyEl);
}
