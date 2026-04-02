/* eslint-disable func-names */
// import { readBlockConfig } from '../../scripts/aem.js';



const generateCard = (info) => {
  info?.classList?.add?.('list-card');
  // // eslint-disable-next-line no-unsafe-optional-chaining
  // const [ infoEL, titleEL, textEL, text2, location]= info?.children ?? []
};

/**
 * Information List Module Block
 */
export default function decorate(block) {
  // const config = readBlockConfig(block);
  const [stage, category, ...infoList] = [...block.children];
  stage?.parentNode?.parentNode?.setAttribute('data-tag', stage.firstElementChild.textContent?.trim());
  category.parentNode?.parentNode?.setAttribute('data-item-tag', category.firstElementChild.textContent?.trim());
  stage.className = 'card-name';
  stage?.remove?.();
  category?.remove?.();
  
  const wrapper = document.createElement('div');
  wrapper.className = 'list-card-container';
  infoList?.forEach((info) => {
    generateCard(info);
    wrapper.append(info);
  });
  block.replaceChildren(stage, wrapper);
  block.classList.add('loaded');
}

