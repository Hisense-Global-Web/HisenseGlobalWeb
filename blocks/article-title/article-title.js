import { formatIsoToUtcStr } from '../../utils/carousel-common.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
export default async function decorate(block) {
  const MateSpaceEl = document.createElement('div');
  MateSpaceEl.classList.add('mate-space');
  const MateEl = document.createElement('div');
  const lineEl = document.createElement('div');
  lineEl.className = 'mate-line';
  [...block.children].forEach((child) => {
    const type = child.firstElementChild.textContent;
    MateEl.className = 'article-meta-group';
    if (type === 'title-content' || type === 'subtitle-content') {
      child.setAttribute('class', type);
      child.firstElementChild.remove();
    } else if (type === 'article-date') {
      if (MateEl.childNodes.length) {
        MateEl.appendChild(lineEl.cloneNode(true));
      }
      child.setAttribute('class', type);
      child.firstElementChild.remove();
      const iconEl = document.createElement('img');
      iconEl.src = `/content/dam/hisense/${country}/common-icons/time.svg`;
      const date = child.textContent.trim();
      const dateEl = document.createElement('span');
      dateEl.textContent = formatIsoToUtcStr(date);
      child.replaceChildren(iconEl, dateEl);
      MateEl.appendChild(child);
    } else if (type === 'article-location') {
      if (MateEl.childNodes.length) {
        MateEl.appendChild(lineEl.cloneNode(true));
      }
      child.setAttribute('class', type);
      child.firstElementChild.remove();
      const iconEl = document.createElement('img');
      iconEl.src = `/content/dam/hisense/${country}/common-icons/address.svg`;
      const address = child.textContent.trim();
      const addressEl = document.createElement('span');
      addressEl.textContent = address;
      child.replaceChildren(iconEl, addressEl);
      MateEl.appendChild(child);
    } else if (type === 'article-author') {
      child.setAttribute('class', type);
      child.firstElementChild.remove();
      MateSpaceEl.appendChild(child);
    }
  });
  if (window.location.pathname.indexOf('blog') !== -1) {
    MateSpaceEl.appendChild(MateEl);
    block.appendChild(MateSpaceEl);
  } else {
    block.appendChild(MateEl);
  }
}
