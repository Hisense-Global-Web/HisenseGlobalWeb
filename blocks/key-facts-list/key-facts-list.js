import translate from '../../utils/translate.js';
import { getLocaleFromPath } from '../../scripts/locale-utils.js';

export default function decorate(block) {
  const TitleEl = document.createElement('div');
  TitleEl.className = 'article-title-list-title';
  const { language } = getLocaleFromPath();
  TitleEl.textContent = translate('KEY_FACTS', language);

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
