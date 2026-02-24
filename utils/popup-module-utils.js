// block element append to popup container element
export function popupContainerAddBlockUtils(block) {
  const sectionPopupContainerDom = block.parentElement.closest('.popup-module-container');
  if (sectionPopupContainerDom) {
    const popupContentDom = sectionPopupContainerDom.querySelector('.popup-content-container');
    popupContentDom.append(block.parentElement);
  }
}

// show popup
export function popupShowUtils(e) {
  e.stopPropagation();
  // 获取目标 data-id 值
  const ctaId = e.target.dataset.id;
  // 找到对应 data-id 的 popup
  const targetPopup = document.querySelector(`.popup-module-container[data-id="${ctaId}"]`);
  // const popupMaskDom = document.querySelector('.popup-mask');
  if (targetPopup) {
    // 先隐藏所有 popup 元素
    // document.querySelectorAll('.popup-module-container').forEach(popupItem => {
    //     popupItem.classList.remove('popup-show');
    // });

    document.body.style.overflow = 'hidden';
    // 显示目标 popup 元素
    targetPopup.classList.add('popup-show');
    // popupMaskDom.classList.add('popup-mask-show');
  }
}
