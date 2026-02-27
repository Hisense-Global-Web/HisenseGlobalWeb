export default function decorate(block) {
  // create close button
  const closeDivEl = document.createElement('div');
  closeDivEl.className = 'popup-close';
  const closeImgEl = document.createElement('img');
  closeImgEl.src = '/content/dam/hisense/us/common-icons/close-50.svg';
  closeImgEl.alt = 'Close Image';
  closeDivEl.append(closeImgEl);

  // close popup
  closeDivEl.addEventListener('click', () => {
    document.querySelectorAll('.popup-module-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
    });
    document.body.style.overflow = 'auto';
  });

  // popup content container element is scrollable when content height exceeds max-height
  const popupContentDom = document.createElement('div');
  popupContentDom.className = 'popup-content-container';
  block.appendChild(popupContentDom);
  [...block.children].forEach((row) => {
    if (!row.classList.contains('popup-close') && !row.classList.contains('popup-content-container')) {
      popupContentDom.appendChild(row);
    }
  });

  // popup container element
  const popupContainerEl = document.createElement('div');
  popupContainerEl.className = 'popup-container';
  popupContainerEl.append(closeDivEl, popupContentDom);
  block.append(popupContainerEl);

  // default hide popup when page load
  const isEditorMode = block.hasAttribute('data-aue-resource')
  || block.hasAttribute('data-aue-type')
  || block.closest('[data-aue-resource]')
  || block.closest('[data-aue-type]');
  if (!isEditorMode) {
    // 非编辑模式下隐藏所有 popup 元素
    document.querySelectorAll('.popup-module-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
      document.body.style.overflow = 'auto';
    });
  }
}
