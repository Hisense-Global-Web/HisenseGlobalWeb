import { getLocaleFromPath } from '../../scripts/locale-utils.js';

export default function decorate(block) {
  try {
    const { country } = getLocaleFromPath();
    const qrObject = []; // 所有回收分类的标题与二维码

    // qr popup dom
    const qrMask = document.createElement('div');
    qrMask.className = 'qr-mask';
    const qrPopupBox = document.createElement('div');
    qrPopupBox.className = 'qr-popup-box';
    const qrClose = document.createElement('img');
    qrClose.className = 'qr-close';
    qrClose.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
    const qrPopupTit = document.createElement('div');
    qrPopupTit.className = 'qr-popup-tit';
    const qrPopupTip = document.createElement('div');
    qrPopupTip.className = 'qr-popup-tip';
    qrPopupTip.textContent = '请使用海信爱家APP扫描二维码，查看回收相关资料';
    const qrPopupImg = document.createElement('img');
    qrPopupImg.className = 'qr-popup-img';
    qrPopupBox.append(qrClose, qrPopupTit, qrPopupTip);
    qrMask.append(qrPopupBox);
    qrClose.addEventListener('click', () => {
      qrMask.classList.remove('show');
      document.body.style.overflow = 'auto';
    });

    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('category-support-card-item');
      const [icon, description, link, iconPopup, qrImgDom] = element.children;
      icon?.classList?.add('category-support-card-item-icon');
      description?.classList?.add('category-support-card-item-description');
      const linkUrl = link.querySelector('a') ? link.querySelector('a').href : '#';
      link?.remove();
      // 点击扫码存在
      if (iconPopup && iconPopup.textContent.trim()) {
        element.classList.add('qr-card-item');
        iconPopup?.classList?.add('icon-popup');
        // 为点击扫码按钮配置data-qr-type 属性
        const currentQRType = description.textContent.trim();
        iconPopup.setAttribute('data-qr-type', currentQRType);
        iconPopup.querySelector('p').className = 'qr-code-txt';
        const qrIcon = document.createElement('img');
        qrIcon.className = 'qr-icon';
        qrIcon.src = `/content/dam/hisense/${country}/common-icons/qr-icon.svg`;
        iconPopup.prepend(qrIcon);
        let authorQRImg = '';
        if (qrImgDom.querySelector('img')) {
          // author 端配置的二维码
          authorQRImg = qrImgDom.querySelector('img').getAttribute('src');
          qrImgDom.remove();
        } else {
          // 移除dom 元素，避免空元素占位 ，item 元素不等高
          qrImgDom.remove();
        }
        // 整合配置的二维码图片与标题
        qrObject.push({
          qrImgSrc: authorQRImg ?? null,
          qrTitText: currentQRType ?? '',
        });

        // 点击【点击扫码】按钮，展示点击扫码popup
        iconPopup.addEventListener('click', () => {
          qrPopupImg.remove();
          const curQRImgSrc = qrObject.find((item) => item.qrTitText === currentQRType)?.qrImgSrc ?? null;
          qrMask.querySelector('.qr-popup-tit').textContent = `回收${currentQRType}`;
          if (curQRImgSrc) {
            qrPopupImg.src = curQRImgSrc;
            qrPopupBox.append(qrPopupImg);
          }
          document.body.style.overflow = 'hidden';
          qrMask.classList.toggle('show');
        });
      } else {
        element.addEventListener('click', () => {
          window.location.href = linkUrl;
        });
      }
      const allQRCardItem = block.querySelectorAll('.qr-card-item');
      if (allQRCardItem.length) {
        // 点击扫码弹窗只生成一次 dom
        block.closest('.category-support-card-wrapper').append(qrMask);
      }
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Category Support Card block decoration error:', error);
  }
}
