// show popup
export default function popupShowUtils(e) {
  e.stopPropagation();
  // 获取目标 data-id 值
  const ctaId = e.target.dataset.id;
  // 找到对应 data-id 的 popup
  const targetPopup = document.querySelector(`.popup-module-container[data-id="${ctaId}"]`);
  if (targetPopup) {
    document.body.style.overflow = 'hidden';
    // 显示目标 popup 元素
    targetPopup.classList.add('popup-show');
  }
}
