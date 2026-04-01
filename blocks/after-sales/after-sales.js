// import { readBlockConfig } from '../../scripts/aem.js';

// const segments = window.location.pathname.split('/').filter(Boolean);
// const country = segments[segments[0] === 'content' ? 2 : 0] || '';

const generateCard = (info) => {
  info?.classList?.add?.('info-list-card');
  const [documentIconEl, infoEL, titleEl, textEl, subTextEl, locationEl] = info?.children ?? [];

  const wrapper = document.createElement('div');

  // card 左侧: icon
  documentIconEl?.classList?.add?.('card-image');

  if (infoEL) {
    infoEL.classList.add('card-info');
  }
  if (titleEl) {
    titleEl.classList.add('card-title');
  }
  if (textEl) {
    textEl.classList.add('card-text');
  }
  if (subTextEl) {
    subTextEl.classList.add('card-text');
  }

  if (locationEl) {
    locationEl.classList.add('card-location');
    locationEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/location-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    locationEl.appendChild(iconImg);
  }
  wrapper.append(infoEL, titleEl, textEl, subTextEl, locationEl);
  wrapper.className = 'title-container';
  info.replaceChildren(documentIconEl, wrapper);
};

/**
 * Information List Module Block
 */
export default function decorate(block) {
  // const config = readBlockConfig(block);
  const [pageSizeEl, noResultEl, ...infoList] = [...block.children];

  pageSizeEl?.remove?.();
  noResultEl?.remove?.();

  infoList?.forEach((info) => {
    generateCard(info);
  });

  block.classList.add('loaded');
}
