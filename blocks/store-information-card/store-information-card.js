/* eslint-disable func-names */
// import { readBlockConfig } from '../../scripts/aem.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

const generateCard = (info) => {
  info?.classList?.add?.('list-card');
  // eslint-disable-next-line no-unsafe-optional-chaining
  const [ infoEL, titleEL, textEL, text2, location]= info?.children ?? [];

  if (infoEL) infoEL.classList = 'card-info';
  if (titleEL) titleEL.classList = 'card-title';
  if (textEL) textEL.classList = 'card-text';
};

/**
 * Information List Module Block
 */
export default function decorate(block) {
  // const config = readBlockConfig(block);
  const [stage, category, ...infoList] = [...block.children];
  stage?.parentNode?.parentNode?.setAttribute('data-tag', stage.firstElementChild.textContent?.trim());
  category.parentNode?.parentNode?.setAttribute('data-item-tag', stage.firstElementChild.textContent?.trim());
  stage.className = 'card-name';
  const arrow = document.createElement('img');
  arrow.classList.add('arrow');
  arrow.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
  arrow.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('e', e);
    e?.target?.parentNode?.classList.toggle('hide');
    // const targetIndex = e.target.getAttribute('data-target-index');
    // const allCards = document.querySelectorAll('.card-image');
    // const targetCard = allCards[targetIndex];
    // if (targetCard) {
    //   // 找到这个卡片相关的需要显示/隐藏的内容
    //   const contentToToggle = targetCard.nextElementSibling;
    //   if (contentToToggle) {
    //     // 更新箭头状态
    //     e.target.classList.toggle('hide');
    //   }
    // }
  });
  stage.append(arrow);
  const wrapper = document.createElement('div');
  wrapper.className = 'list-card-container';
  infoList?.forEach((info) => {
    generateCard(info);
    wrapper.append(info);
  });
  block.replaceChildren(stage, wrapper);
  block.classList.add('loaded');
}

