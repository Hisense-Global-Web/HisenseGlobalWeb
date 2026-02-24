// export default function decorate () {
//   console.log('9876s543');
// }
// console.log('section-popup-js');
export default function decorate(block) {
  console.log(block, 'section-popup-block');
  // create popup container
  const popupContainer = document.createElement('div');
  popupContainer.className = 'popup-container';
  block.appendChild(popupContainer);
  // [...block.children].forEach((row, index) => {
  //   row.className = `popup-row-${index}`;
  //   popupContainer.appendChild(row);
  // });

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
  // [...block.children].forEach((row) => {
  //   if (!row.classList.contains('popup-close')) {
  //     popupContentContainer.appendChild(row);
  //   }
  // });

  // close popup
  closeDivEl.addEventListener('click', () => {
    document.querySelectorAll('.popup-container-container').forEach((popupItem) => {
      popupItem.classList.remove('popup-show');
    });
    document.body.style.overflow = 'auto';
  });
}
