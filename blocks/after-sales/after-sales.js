// import { readBlockConfig } from '../../scripts/aem.js';

// const segments = window.location.pathname.split('/').filter(Boolean);
// const country = segments[segments[0] === 'content' ? 2 : 0] || '';

const generateCard = (info) => {
  info?.classList?.add?.('info-list-card');
  // eslint-disable-next-line no-unsafe-optional-chaining
  const [tag, infoEL, title,text1,text2, location]= info?.children ?? [];
  if (tag) {
    tag?.parentNode?.parentNode?.setAttribute('data-item-tag', tag.lastElementChild.textContent?.trim())
  }
};

/**
 * Information List Module Block
 */
export default function decorate(block) {
  // const config = readBlockConfig(block);
  const [area, ...infoList] = [...block.children];
  area?.parentNode?.parentNode?.setAttribute('data-tag', area.lastElementChild.textContent?.trim());

  infoList?.forEach((info) => {
    generateCard(info);
  });

  block.classList.add('loaded');
}
