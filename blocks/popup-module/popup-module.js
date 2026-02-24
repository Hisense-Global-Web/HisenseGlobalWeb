export default function decorate(block) {
  // console.log(block, 'section-popup-block');
  // create popup mask
  const popupMaskDom = document.querySelector('.popup-mask');
  if (!popupMaskDom) {
    const popupMaskEl = document.createElement('div');
    popupMaskEl.className = 'popup-mask';
    block.parentNode.append(popupMaskEl);
  }

  // create close button
  const closeDivEl = document.createElement('div');
  closeDivEl.className = 'popup-close';
  const closeImgEl = document.createElement('img');
  closeImgEl.src = '/content/dam/hisense/us/common-icons/close-50.svg';
  closeImgEl.alt = 'Close Image';
  closeDivEl.append(closeImgEl);
  block.appendChild(closeDivEl);

  // close popup
  closeDivEl.addEventListener('click', () => {
    document.querySelectorAll('.popup-module-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
    });
    document.querySelector('.popup-mask').classList.remove('popup-mask-show');
    document.body.style.overflow = 'auto';
  });

  // default hide popup when page load
  const isEditorMode = block.hasAttribute('data-aue-resource')
  || block.hasAttribute('data-aue-type')
  || block.closest('[data-aue-resource]')
  || block.closest('[data-aue-type]');
  if (isEditorMode) {
    const popupShowLength = document.querySelectorAll('.popup-show')
    if (popupShowLength.length) {
      document.querySelector('.popup-mask').classList.add('popup-mask-show');
      document.body.style.overflow = 'hidden';
    } else {
      document.querySelector('.popup-mask').classList.remove('popup-mask-show');
      document.body.style.overflow = 'auto';
    }
  } else {
    // 非编辑模式下隐藏所有 popup 元素
    document.querySelectorAll('.popup-module-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
      document.body.style.overflow = 'auto';
    });
  }
}
