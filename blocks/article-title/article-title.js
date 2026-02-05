import { formatIsoToUtcStr } from '../../utils/carousel-common.js';

export default async function decorate(block) {
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
      iconEl.src = '/content/dam/hisense/us/common-icons/time.svg';
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
      iconEl.src = '/content/dam/hisense/us/common-icons/address.svg';
      const address = child.textContent.trim();
      const addressEl = document.createElement('span');
      addressEl.textContent = address;
      child.replaceChildren(iconEl, addressEl);
      MateEl.appendChild(child);
    }
  });
  block.appendChild(MateEl);
}
