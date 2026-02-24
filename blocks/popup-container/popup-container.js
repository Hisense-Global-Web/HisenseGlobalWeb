export default function decorate(block) {
  const closeDivEl = document.createElement('div');
  closeDivEl.className = 'popup-close';
  const closeImgEl = document.createElement('img');
  closeImgEl.src = '/content/dam/hisense/us/common-icons/close-50.svg';
  closeImgEl.alt = 'Close Image';
  closeDivEl.append(closeImgEl);
  [...block.children].forEach((row) => {
    row.prepend(closeDivEl);
    row.className = 'popup-container-box';
    [...row.children].forEach((column, colIndex) => {
      if (colIndex === 1) {
        column.className = 'popup-content-container';
        // In editor mode, the value is set in popup module block, and used to control whether show popup or not when page load
        const popupVisibility = column.firstElementChild.innerText;
        if (popupVisibility === 'true') {
          column.parentElement.closest('.popup-container-container').classList.add('popup-show');
          document.body.style.overflow = 'hidden';
        } else {
          column.parentElement.closest('.popup-container-container').classList.remove('popup-show');
          document.body.style.overflow = 'auto';
        }
        column.firstElementChild.remove();
      }
    });
  });
  // close popup
  closeDivEl.addEventListener('click', () => {
    document.querySelectorAll('.popup-container-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
    });
    document.body.style.overflow = 'auto';
  });

  // default hide popup when page load
  const isEditorMode = block.hasAttribute('data-aue-resource')
  || block.hasAttribute('data-aue-type')
  || block.closest('[data-aue-resource]')
  || block.closest('[data-aue-type]');
  if (!isEditorMode) {
    // 非编辑模式下隐藏所有 popup 元素
    document.querySelectorAll('.popup-container-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
      document.body.style.overflow = 'auto';
    });
  }
}
