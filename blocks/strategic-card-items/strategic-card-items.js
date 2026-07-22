import { whenElementReady } from '../../utils/carousel-common.js';
import popupShowUtils from '../../utils/popup-module-utils.js';
import { checkSwitch, getSwitchValue } from '../../utils/ue-helper.js';

function bindEvent(block) {
  const triggerBtns = block.querySelectorAll('.btn-label'); // 触发按钮
  triggerBtns.forEach((triggerBtn) => {
    const popupSectionId = triggerBtn.parentElement.querySelector('.btn-popup-id')?.textContent.trim();
    if (triggerBtn && popupSectionId) {
      triggerBtn.setAttribute('data-id', popupSectionId);
      triggerBtn.addEventListener('click', popupShowUtils);
    }
  });
}

export default function decorate(block) {
  const containerDiv = document.createElement('div');
  containerDiv.classList.add('card-container');
  if (block.children.length > 5) containerDiv.classList.add('small-gap');
  [...block.children].forEach((child) => {
    child.className = 'strategic-card-item';
    if (!child.children.length) return;
    let isCapitalized = true;
    if (checkSwitch(child.children[1])) {
      isCapitalized = getSwitchValue(child.children[1]);
      child.children[1].remove();
    }
    const [iconDiv, textDiv, bodyCopy, btnDiv] = child.children;
    iconDiv.className = 'card-icon';
    textDiv.className = 'card-text';
    if (isCapitalized) {
      textDiv.classList.add('strategic-card-first-letter');
    }
    bodyCopy.className = 'card-description';
    btnDiv.className = 'card-btn';
    if (!bodyCopy.textContent.trim()) bodyCopy.remove();
    if (btnDiv.children.length === 2) {
      const [label, popupId] = btnDiv.children;
      label.className = 'btn-label';
      popupId.className = 'btn-popup-id';
    } else {
      btnDiv.style.display = 'none';
    }
    containerDiv.append(child);
  });
  block.replaceChildren(containerDiv);
  if (!block.querySelector('.btn-label')) return;
  whenElementReady('.strategic-card-items', () => {
    bindEvent(block);
  });
}
