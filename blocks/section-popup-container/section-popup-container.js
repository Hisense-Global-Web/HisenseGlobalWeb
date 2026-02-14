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
        // popup visibility
        const popupVisibility = column.firstElementChild.innerText;
        if (popupVisibility === 'true') {
          column.parentElement.closest('.section-popup-container-container').classList.add('popup-show');
        } else {
          column.parentElement.closest('.section-popup-container-container').classList.remove('popup-show');
        }
        column.firstElementChild.remove();
      }
    });
  });
  // close popup
  closeDivEl.addEventListener('click', () => {
    document.querySelectorAll('.section-popup-container-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
    });
    document.body.style.overflow = 'auto';
  });
}
