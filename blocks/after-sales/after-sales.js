// import { readBlockConfig } from '../../scripts/aem.js';

// const segments = window.location.pathname.split('/').filter(Boolean);
// const country = segments[segments[0] === 'content' ? 2 : 0] || '';

const generateCard = (info) => {
  info?.classList?.add?.('info-list-card');
  // eslint-disable-next-line no-unsafe-optional-chaining
  [...info?.children].forEach((item) =>{
  
  })


};

/**
 * Information List Module Block
 */
export default function decorate(block) {
  // const config = readBlockConfig(block);
  const [area, ...infoList] = [...block.children];
    console.log(area);
    area?.parentNode?.parentNode?.setAttribute('data-tag', area.lastElementChild.textContent?.trim());

  infoList?.forEach((info) => {
    generateCard(info);
  });

  block.classList.add('loaded');
}
