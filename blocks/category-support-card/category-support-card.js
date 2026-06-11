import { getLocaleFromPath } from '../../scripts/locale-utils.js';

export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    const qrMask = document.createElement('div');
    qrMask.className = 'qr-mask';
    const qrPopupBox = document.createElement('div');
    qrPopupBox.className = 'qr-popup-box';
    const qrClose = document.createElement('img');
    qrClose.className = 'qr-close';
    const qrPopupTit = document.createElement('div');
    qrPopupTit.className = 'qr-popup-tit';
    const qrPopupTip = document.createElement('div');
    qrPopupTip.className = 'qr-popup-tip';
    const qrPopupImg = document.createElement('img');
    qrPopupImg.className = 'qr-popup-img';
    elementItems.forEach((element) => {
      element.classList.add('category-support-card-item');
      const [icon, description, link, iconPopup] = element.children;
      icon?.classList?.add('category-support-card-item-icon');
      description?.classList?.add('category-support-card-item-description');
      const linkUrl = link.querySelector('a') ? link.querySelector('a').href : '#';
      link?.remove();
      iconPopup?.classList?.add('icon-popup');
      if (iconPopup && iconPopup.textContent.trim()) {
        iconPopup.querySelector('p').className = 'qr-code-txt';
        const qrIcon = document.createElement('img');
        qrIcon.className = 'qr-icon';
        const { country } = getLocaleFromPath();
        qrIcon.src = `/content/dam/hisense/${country}/common-icons/qr-icon.svg`;
        iconPopup.prepend(qrIcon);
        // 点击扫码配置有内容时，展示点击扫码popup
      } else {
        element.addEventListener('click', () => {
          window.location.href = linkUrl;
        });
      }
      // element.addEventListener('click', () => {
      //   window.location.href = linkUrl;
      // });
    });

    qrPopupBox.append(qrClose, qrPopupTit, qrPopupTip, qrPopupImg);
    qrMask.append(qrPopupBox);
    block.closest('.category-support-card-wrapper').append(qrMask);
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Category Support Card block decoration error:', error);
  }
}
