
export default function decorate(block) {
  let height;
  // console.log(block, 'section-popup-block');
  // create popup mask
  // const popupMaskDom = document.querySelector('.popup-mask');
  // if (!popupMaskDom) {
  //   const popupMaskEl = document.createElement('div');
  //   popupMaskEl.className = 'popup-mask';
  //   block.parentNode.append(popupMaskEl);
  // }

  // create close button
  const closeDivEl = document.createElement('div');
  closeDivEl.className = 'popup-close';
  const closeImgEl = document.createElement('img');
  closeImgEl.src = '/content/dam/hisense/us/common-icons/close-50.svg';
  closeImgEl.alt = 'Close Image';
  closeDivEl.append(closeImgEl);
  // block.appendChild(closeDivEl);

  // close popup
  closeDivEl.addEventListener('click', () => {
    document.querySelectorAll('.popup-module-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
    });
    // document.querySelector('.popup-mask').classList.remove('popup-mask-show');
    document.body.style.overflow = 'auto';
  });

  // popup content container element is scrollable when content height exceeds max-height
  const popupContentDom = document.createElement('div');
  popupContentDom.className = 'popup-content-container';
  block.appendChild(popupContentDom);
  // console.log(block, 'block');
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
  if (isEditorMode) {
    // 编辑模式下， 找到包裹页面iframe 的 类名为 EditableOverlays 的 main 元素，将其设置为overflow:hidden，避免编辑器页面滚动导致的popup滚动问题
    block.closest('.EditableOverlays').style.overflow = 'hidden';
    height = document.getElementByClass('EditableOverlays').clientHeight;
  } else {
    // 非编辑模式下隐藏所有 popup 元素
    document.querySelectorAll('.popup-module-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
      document.body.style.overflow = 'auto';
    });
    height = window.innerHeight;
  }
  document.documentElement.style.setProperty('--ue-viewport-height', `${height}px`);
}
