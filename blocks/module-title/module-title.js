// import { readBlockConfig } from '../../scripts/aem.js';

// import { popupContainerAddBlockUtils } from '../../utils/section-popup-utils.js';
import { popupContainerAddBlockUtils } from '../../utils/popup-module-utils.js';

export default async function decorate(block) {
  [...block.children].forEach((child) => {
    child.setAttribute('class', child.firstElementChild.textContent);
    child.firstElementChild.remove();
  });

  // popup add module title block
  // const sectionPopupContainerDom = block.parentElement.closest('.section-popup-container-container');
  // if (sectionPopupContainerDom) {
  //   const popupContentDom = sectionPopupContainerDom.querySelector('.popup-content-container');
  //   popupContentDom.append(block.parentElement)
  // }
  popupContainerAddBlockUtils(block);

  // module title text align type
  const textAlignType = document.querySelector('.text-align-type p').innerHTML;
  if (textAlignType) {
    document.querySelector('.text-align-type').parentElement.classList.add(textAlignType);
    document.querySelector('.text-align-type').remove();
  }
}
