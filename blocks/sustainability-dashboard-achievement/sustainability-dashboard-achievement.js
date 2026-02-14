import { readBlockConfig } from '../../scripts/aem.js';
import { whenElementReady } from '../../utils/carousel-common.js';

function bindEvent(block) {
  const triggerBtn = block.querySelector('.btn-cta'); // 你的触发按钮
  const popupSectionId = block.querySelector('.btn-popup-id')?.querySelector('p').textContent;

  const sourceSection = document.getElementById(popupSectionId);

  if (triggerBtn && sourceSection) {
    triggerBtn.addEventListener('click', () => {
      const overlayId = `popup-overlay-${popupSectionId}`;
      let overlay = document.getElementById(overlayId);
      if (!overlay) {
        // 1. 创建遮罩层
        overlay = document.createElement('div');
        overlay.className = 'popup-overlay';
        overlay.id = overlayId;

        // 2. 创建弹窗容器
        const popup = document.createElement('div');
        popup.className = 'popup-container';

        // 3. 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'popup-close';
        closeBtn.innerHTML = '&times;'; // 简单的 X 符号

        // 4. 克隆内容 (true 表示深克隆，包含子节点)
        const content = sourceSection.cloneNode(true);
        content.removeAttribute('id'); // 移除克隆体的 ID，避免页面 ID 冲突
        content.style.display = 'block'; // 确保它是可见的

        // 5. 组装 DOM
        popup.append(closeBtn, content);
        overlay.append(popup);
        document.body.append(overlay);

        // 6. 禁止背景滚动
        document.body.style.overflow = 'hidden';
      } else {
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
      // 7. 关闭逻辑
      const closePopup = () => {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      };

      overlay.querySelector('.popup-close').onclick = closePopup;
      // overlay.onclick = (e) => {
      //   if (e.target === overlay) closePopup(); // 点击遮罩层关闭
      // };
    });
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
  textArea.appendChild(titleArea);
  const items = document.createElement('div');
  items.className = 'matrix-block-items';
  [...block.children].forEach((child) => {
    if (Object.keys(config).includes(child.firstElementChild?.textContent.trim().toLowerCase())) {
      child.classList.add(child.firstElementChild?.textContent.trim());
      child.firstElementChild.remove();
    }
    if (child.classList.contains('matrix-block-item')) {
      const label = ['matrix-label', 'matrix-value'];
      // blockItem 最少两个节点，最多4个节点
      const blockItem = Array.from(child.children);
      for (let i = 0; i < blockItem.length; i += 2) {
        const labelDiv = blockItem[i];
        const valueDiv = blockItem[i + 1];

        // 获取标签内容，比如 "matrix-label" 或 "matrix-value"
        const labelText = labelDiv?.querySelector('p')?.textContent.trim();

        if (label.includes(labelText) && !label.includes(valueDiv)) {
          // 将内容作为类名添加
          const className = labelText;
          valueDiv.classList.add(className);
          labelDiv.remove();
        }
      }
    }
    if (!child.classList.contains('image')) {
      if (!child.className.includes('btn')) {
        if (child.className !== 'matrix-block-item') {
          titleArea.appendChild(child);
        } else items.appendChild(child);
      } else if (child.className.includes('btn')) {
        btnDiv.appendChild(child);
      } else {
        textContainer.appendChild(child);
      }
    }
  });
  [...items.children].forEach((item) => {
    if (item !== [...items.children][items.children.length - 1]) {
      const line = document.createElement('span');
      line.className = 'line';
      item.after(line);
    }
  });
  textArea.appendChild(items);
  textContainer.appendChild(textArea);
  textContainer.appendChild(btnDiv);
  block.appendChild(textContainer);
  whenElementReady('.sustainability-dashboard-achievement', () => {
    bindEvent(block);
  });
}
