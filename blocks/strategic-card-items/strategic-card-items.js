import { whenElementReady } from '../../utils/carousel-common.js';
import popupShowUtils from '../../utils/popup-module-utils.js';

function bindEvent(block) {
  const triggerBtns = block.querySelectorAll('.btn-label'); // 触发按钮
  triggerBtns.forEach(triggerBtn=> {
    const popupSectionId = triggerBtn.parentElement.querySelector('.btn-popup-id')?.textContent.trim();
    if (triggerBtn && popupSectionId) {
      triggerBtn.setAttribute('data-id', popupSectionId);
      triggerBtn.addEventListener('click', popupShowUtils);
    }
  })
}

export default function decorate(block) {
  const containerDiv = document.createElement('div');
  containerDiv.classList.add('card-container');
  [...block.children].forEach((child) => {
    child.className = 'strategic-card-item';
    if (!child.children.length) return;
    const [iconDiv, textDiv, btnDiv] = child.children;
    iconDiv.className = 'card-icon';
    textDiv.className = 'card-text';
    btnDiv.className = 'card-btn';
    if (btnDiv && !btnDiv.textContent.trim()) {
      btnDiv.style.display = 'none';
    } else {
      const [label, popupId] = btnDiv.children;
      label.className = 'btn-label';
      popupId.className = 'btn-popup-id';
    }
    containerDiv.append(child);
  });
  block.replaceChildren(containerDiv);
  whenElementReady('.strategic-card-items', () => {
    bindEvent(block);
  });
}
