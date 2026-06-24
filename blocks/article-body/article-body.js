import wrapInRichtext from '../../utils/wrap-in-richtext.js';
import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    [...block.children].forEach((row) => {
      const type = row.firstElementChild?.textContent?.trim() || '';
      if (type === 'headline') {
        const headlineContent = row.children[1]?.textContent?.trim() || '';
        const headlineDiv = document.createElement('div');
        headlineDiv.className = 'text-body-headerline';
        headlineDiv.innerHTML = headlineContent;
        [...row.children].forEach((i) => { i.style.display = 'none'; });
        row.append(headlineDiv);
      } else if (type === 'image') {
        const imgAEl = row.querySelector('a');
        const imgSrc = imgAEl.getAttribute('href');
        const imgAlt = row.querySelector('[data-aue-prop="alt"]') || document.createElement('p');
        const imageDiv = document.createElement('div');
        imageDiv.className = 'text-body-image';
        imageDiv.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
        [...row.children].forEach((i) => { i.style.display = 'none'; });
        row.append(imageDiv);
      } else if (type === 'content') {
        row.children[0].style.display = 'none';
        const contentDiv = row.children[1];
        contentDiv.className = 'text-body-content';
      } else if (type === 'quote') {
        row.children[0].style.display = 'none';
        const quoteDiv = row.children[1];
        quoteDiv.className = 'text-body-quote';
        const imgEl = document.createElement('img');
        imgEl.className = 'quotation';
        imgEl.src = `/content/dam/hisense/${country}/common-icons/quotation.svg`;
        imgEl.alt = 'quotation';
        quoteDiv.append(imgEl);
        const notesDiv = row.children[2];
        if (notesDiv) {
          notesDiv.className = 'text-body-quote-notes';
          quoteDiv.append(notesDiv);
        }
      } else if (type === 'flexend-side-by-side') {
        const GroupDiv = document.createElement('div');
        GroupDiv.className = 'text-body-group-flexend';
        // 图
        const imgGroupDiv = document.createElement('div');
        const imgAEl = row.querySelector('p:not([data-aue-label="Title"]):not([data-aue-label="Text"]) a');
        const imgUrl = imgAEl.getAttribute('href');
        imgGroupDiv.className = 'text-body-img-group';
        const imgEl = document.createElement('img');
        imgEl.src = imgUrl;
        imgGroupDiv.append(imgEl);
        // 文
        const textGroupDiv = document.createElement('div');
        const title = row.querySelector('[data-aue-label="Title"]') || document.createElement('p');
        title.className = 'text-body-title';
        const desc = row.querySelector('[data-aue-label="Text"]') || document.createElement('p');
        desc.className = 'text-body-desc';
        textGroupDiv.className = 'text-body-text-group';
        textGroupDiv.append(title, desc);
        if (imgAEl) {
          GroupDiv.append(imgGroupDiv);
        }
        GroupDiv.append(textGroupDiv);
        [...row.children].forEach((i) => { i.style.display = 'none'; });
        row.append(GroupDiv);
      }
    });
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
      const imgAEl = row.querySelector('a');
      const imgEl = row.querySelector('img');
      const imgSrc = imgEl?.src || imgAEl.getAttribute('href');
      const imgAlt = row.children[2]?.textContent?.trim() || '';
      const imageDiv = document.createElement('div');
      imageDiv.className = 'text-body-image';
      imageDiv.append(createDynamicMediaPicture(imgSrc, imgAlt));
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
      imgEl.src = `/content/dam/hisense/${country}/common-icons/quotation.svg`;
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
      imgGroupDiv.className = 'text-body-img-group';
      const imgEl = row.children[2].querySelector('img');
      const imgAEl = row.children[2].querySelector('a');
      if (imgEl) {
        imgGroupDiv.append(createDynamicMediaPicture(imgEl.href));
      } else if (!imgEl && imgAEl) {
        const imgUrl = imgAEl.getAttribute('href');
        imgGroupDiv.append(createDynamicMediaPicture(imgUrl));
      }
      // 文
      const textGroupDiv = document.createElement('div');
      const title = row.children[3] || '';
      title.className = 'text-body-title';
      const desc = row.children[4] || '';
      desc.className = 'text-body-desc';
      textGroupDiv.className = 'text-body-text-group';
      textGroupDiv.append(title, desc);
      if (imgEl || (!imgEl && imgAEl)) {
        GroupDiv.append(imgGroupDiv);
      }
      GroupDiv.append(textGroupDiv);
      ArticleBodyDiv.append(GroupDiv);
    } else {
      ArticleBodyDiv.append(row);
    }
  });
  block.replaceChildren(...ArticleBodyDiv.children);
  wrapInRichtext(block);
}
