export default function decorate(block) {
  // console.log(block, 'section-popup-block');
  // create popup container
  const popupContainer = document.createElement('div');
  popupContainer.className = 'popup-container';
  block.appendChild(popupContainer);

  // create close button
  const closeDivEl = document.createElement('div');
  closeDivEl.className = 'popup-close';
  const closeImgEl = document.createElement('img');
  closeImgEl.src = '/content/dam/hisense/us/common-icons/close-50.svg';
  closeImgEl.alt = 'Close Image';
  closeDivEl.append(closeImgEl);
  popupContainer.appendChild(closeDivEl);

  // create popup content container
  const popupContentContainer = document.createElement('div');
  popupContentContainer.className = 'popup-content-container';
  popupContainer.appendChild(popupContentContainer);

  // close popup
  closeDivEl.addEventListener('click', () => {
    document.querySelectorAll('.popup-module-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
    });
    document.body.style.overflow = 'auto';
  });
}
