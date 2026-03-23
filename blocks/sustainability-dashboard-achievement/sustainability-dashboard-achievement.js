import { readBlockConfig } from '../../scripts/aem.js';
import { whenElementReady } from '../../utils/carousel-common.js';
import popupShowUtils from '../../utils/popup-module-utils.js';

function bindEvent(block) {
  const triggerBtn = block.querySelector('.btn-label > div > p'); // 触发按钮
  const popupSectionId = block.querySelector('.btn-popup-id')?.textContent.trim();
  if (triggerBtn && popupSectionId) {
    triggerBtn.setAttribute('data-id', popupSectionId);
    triggerBtn.addEventListener('click', popupShowUtils);
  }
}
export default function decorate(block) {
  const config = readBlockConfig(block);
  const textContainer = document.createElement('div');
  textContainer.className = 'text-content';
  const textArea = document.createElement('div');
  textArea.className = 'text-area';
  const btnDiv = document.createElement('div');
  btnDiv.className = 'btn-cta';
  const titleArea = document.createElement('div');
  titleArea.className = 'title-area';
  textArea.append(titleArea);

  [...block.children].forEach((child) => {
    if (Object.keys(config).includes(child.firstElementChild?.textContent.trim().toLowerCase())) {
      child.className = child.firstElementChild?.textContent.trim();
      child.firstElementChild.remove();
    }
    if (!child.classList.contains('image')) {
      if (!child.className.includes('btn')) {
        titleArea.append(child);
      } else if (child.className.includes('btn')) {
        btnDiv.append(child);
      } else {
        textContainer.append(child);
      }
    }
  });
  textContainer.append(textArea);
  if (btnDiv.textContent.trim()) textContainer.append(btnDiv);
  block.append(textContainer);
  // handle child component--achievement-highlights
  if (block.querySelector('.highlights-block-item')) {
    block.querySelectorAll('.highlights-block-item').forEach((highlightsItem, h) => {
      highlightsItem.lastElementChild.className = highlightsItem.firstElementChild.textContent.trim();
      if (highlightsItem.lastElementChild.className) highlightsItem.firstElementChild.remove();

      if (h === 0) {
        highlightsItem.classList.add('mt-32');
      }
    });
  }
  // handle child component--achievement-matrix
  if (block.querySelector('.matrix-block-item')) {
    const items = document.createElement('div');
    items.className = 'matrix-block-items';
    block.querySelectorAll('.matrix-block-item').forEach((matrixItem) => {
      const label = ['matrix-label', 'matrix-value'];
      // matrixItem 最少两个节点，最多4个节点
      const matrixItems = Array.from(matrixItem.children);
      for (let i = 0; i < matrixItems.length; i += 2) {
        const labelDiv = matrixItems[i];
        const valueDiv = matrixItems[i + 1];

        // 获取标签内容，比如 "matrix-label" 或 "matrix-value"
        const labelText = labelDiv?.querySelector('p')?.textContent.trim();

        if (label.includes(labelText) && !label.includes(valueDiv)) {
          // 将内容作为类名添加
          const className = labelText;
          valueDiv.classList.add(className);
          labelDiv.remove();
        }
      }
      items.append(matrixItem);
    });
    // add line
    [...items.children].forEach((item) => {
      if (item !== [...items.children][items.children.length - 1]) {
        const line = document.createElement('span');
        line.className = 'line';
        item.after(line);
      }
    });
    textArea.appendChild(items);
  }
  if (!btnDiv.textContent.trim()) return;
  whenElementReady('.sustainability-dashboard-achievement', () => {
    bindEvent(block);
  });
}
