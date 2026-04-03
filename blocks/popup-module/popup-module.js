const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
export default function decorate(block) {
  // create close button
  const closeDivEl = document.createElement('div');
  closeDivEl.className = 'popup-close';
  const closeImgEl = document.createElement('img');
  closeImgEl.src = `/content/dam/hisense/${country}/common-icons/close-50.svg`;
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

  const popContainerEl = block.querySelector('.popup-container');
  /**
   * 先判断 block 中是否存在 ".popup-container" 元素
   * 为了解决在 author 页面中，编辑其中一个popup module时，去修改另外一个popup module，页面会刷新渲染重复追加元素，导致页面无法review 当前操作的 popup module
   */
  if (!popContainerEl) {
    // popup container element
    const popupContainerEl = document.createElement('div');
    popupContainerEl.className = 'popup-container';
    popupContainerEl.append(closeDivEl, popupContentDom);
    block.append(popupContainerEl);
  }

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
  } else {
    // 编辑模式下，判断 popup 内容高度是否超过视口高度，超过则设置 main 元素高度为 popup 内容高度，避免内容被遮挡无法查看
    const popupHeight = block.querySelector('.popup-container').offsetHeight;
    const viewportHeight = window.innerHeight;
    if (popupHeight > viewportHeight) {
      console.log(document.body, document.querySelector('main'), block.parentElement);
      
      document.body.style.height = `${popupHeight}px`;
    }
  }
}
