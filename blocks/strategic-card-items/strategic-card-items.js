import { whenElementReady } from '../../utils/carousel-common.js';
import popupShowUtils from '../../utils/popup-module-utils.js';

function bindEvent(block) {
  const triggerBtn = block.querySelector('.btn-label'); // 触发按钮
  const popupSectionId = block.querySelector('.btn-popup-id')?.textContent.trim();
  triggerBtn.setAttribute('data-id', popupSectionId);
  triggerBtn && triggerBtn.addEventListener('click', popupShowUtils);
}

export default function decorate(block) {
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
  });

  whenElementReady('.strategic-card-items', () => {
    bindEvent(block);
  });
}
