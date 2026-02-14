import { whenElementReady } from '../../utils/carousel-common.js';

function bindEvent(block) {
  const triggerBtn = block.querySelector('.btn-cta'); // 你的触发按钮
  const popupSectionId = block.querySelector('.btn-popup-id')?.textContent;

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
    [...block.children].forEach(child=>{
        child.className = 'strategic-card-item';
        if(!child.children.length) return;
        const [iconDiv, textDiv, btnDiv] = child.children;
        iconDiv.className = 'card-icon';
        textDiv.className = 'card-text';
        btnDiv.className = 'card-btn';
        if(btnDiv && !btnDiv.textContent.trim()) {
            btnDiv.style.display = 'none';
        } else {
            const [label, popupId] = btnDiv.children;
            label.className = 'btn-label';
            popupId.className = 'btn-popup-id';
        }
    })

    whenElementReady('.strategic-card-items', () => {
        bindEvent(block);
    });
}