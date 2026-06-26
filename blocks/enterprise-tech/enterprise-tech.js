import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';
export default async function decorate(block) {
  // console.log(block, 'bbb');
  const enterpriseCardWrapperEl = document.createElement('div');
  enterpriseCardWrapperEl.className = 'enterprise-card-wrapper';

  [...block.children].forEach((row) => {
    row.className = 'enterprise-card-box info-hide';
    const infoBoxEl = document.createElement('div');
    infoBoxEl.className = 'info-box';
    const mobileTitWrapperEl = document.createElement('div');
    mobileTitWrapperEl.className = 'mobile-tit-wrapper';
    const [dynamicSwitch, pcImgDom, mobileImgDom, titleBox, subtitleBox, descriptionBox] = [...row.children] ?? [];
    const isDynamicFlag = dynamicSwitch.textContent.trim() === 'true'; // dynamic media 标识
    dynamicSwitch.remove();

    if (pcImgDom) {
      pcImgDom.className = 'pc-image-box';
      if (pcImgDom.querySelector('a') && isDynamicFlag) {
        const dynamicImgSrc = pcImgDom.querySelector('a').getAttribute('href');
        pcImgDom.append(createDynamicMediaPicture(dynamicImgSrc, 'enterprise-card-item-img'));
        pcImgDom.children[0].remove();
      }
    }

    if (mobileImgDom) {
      // mobile 端最终展示的 dom
      let showMobileDom = mobileImgDom;
      showMobileDom.className = 'mobile-image-box';
      if (isDynamicFlag) {
        // 如果启用dynamic media, 直接clone PC 端 img dom 元素，用来动态展示mobile 的图片
        showMobileDom = pcImgDom.cloneNode(true);
        showMobileDom.className = 'mobile-image-box';
        mobileImgDom.remove();
      }
      // 移动端图片处理
      const mobileArrowEl = document.createElement('div');
      mobileArrowEl.className = 'mobile-arrow';
      const arrowImg = document.createElement('img');
      arrowImg.src = `/content/dam/hisense/${country}/common-icons/chevron-white-up.svg`;
      arrowImg.alt = 'Arrow image';
      mobileArrowEl.append(arrowImg);

      const mobileTitBoxEl = document.createElement('div');
      mobileTitBoxEl.className = 'mobile-tit-box';
      // 移动端，将标题和箭头元素整合到一个dom 中
      mobileTitBoxEl.append(titleBox, mobileArrowEl);
      // 将移动端图片与 标题dom 整合
      mobileTitWrapperEl.append(showMobileDom, mobileTitBoxEl);
      // mobile arrow add click event
      const toggleExpand = (e) => {
        e.stopPropagation();
        const grandParent = e.target.closest('.enterprise-card-box');
        if (!grandParent) { return; }
        grandParent.classList.toggle('info-hide');
      };

      mobileArrowEl.addEventListener('click', toggleExpand);
    }

    if (titleBox) {
      titleBox.className = 'title-box';
    }

    if (subtitleBox) {
      subtitleBox.className = 'subtitle-box';
      infoBoxEl.append(subtitleBox);
    }

    if (descriptionBox) {
      descriptionBox.className = 'description-box';
      infoBoxEl.append(descriptionBox);
    }
    row.append(mobileTitWrapperEl, infoBoxEl);
    enterpriseCardWrapperEl.append(row);
  });
  block.append(enterpriseCardWrapperEl);
}
