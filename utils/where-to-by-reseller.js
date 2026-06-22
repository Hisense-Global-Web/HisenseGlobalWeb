import { getLocaleFromPath } from '../scripts/locale-utils.js';
import translate from './translate.js';

/**
 *
 * @param {*} showResellerData 展示经销商数据
 */
export function whereResellerShowDataUtil(resellerPopupBoxEl) {
  const originResellerData = [
    {
      resellerTit: 'Shop with Online Resellers',
      type: 'online',
      resellerImg: 'https://main--hisenseglobalweb--hisense-global-web.aem.page/us/en/media_1f8d7a22459ee173bf260d07dfd92d52e04141066.svg?width=750&format=svg&optimize=medium',
      toUrl: 'https//www.baidu.com',
    },
    {
      resellerTit: 'Shop with Online Resellers',
      type: 'online',
      resellerImg: 'https://main--hisenseglobalweb--hisense-global-web.aem.page/us/en/media_1f8d7a22459ee173bf260d07dfd92d52e04141066.svg?width=750&format=svg&optimize=medium',
      toUrl: 'https//www.baidu.com',
    },
    {
      resellerTit: 'Shop with Online Resellers',
      type: 'online',
      resellerImg: 'https://main--hisenseglobalweb--hisense-global-web.aem.page/us/en/media_1f8d7a22459ee173bf260d07dfd92d52e04141066.svg?width=750&format=svg&optimize=medium',
      toUrl: 'https//www.baidu.com',
    },
    {
      resellerTit: 'Shop with Online Resellers',
      type: 'online',
      resellerImg: 'https://main--hisenseglobalweb--hisense-global-web.aem.page/us/en/media_1f8d7a22459ee173bf260d07dfd92d52e04141066.svg?width=750&format=svg&optimize=medium',
      toUrl: 'https//www.baidu.com',
    },
    {
      resellerTit: 'Shop with Online Resellers',
      type: 'online',
      resellerImg: 'https://main--hisenseglobalweb--hisense-global-web.aem.page/us/en/media_1f8d7a22459ee173bf260d07dfd92d52e04141066.svg?width=750&format=svg&optimize=medium',
      toUrl: 'https//www.baidu.com',
    },
    {
      resellerTit: 'Find a Reseller Near You',
      type: 'outline',
      resellerImg: 'https://main--hisenseglobalweb--hisense-global-web.aem.page/us/en/media_1f8d7a22459ee173bf260d07dfd92d52e04141066.svg?width=750&format=svg&optimize=medium',
      toUrl: 'https//www.baidu.com',
    },
  ];
  // 处理原始数据
  const groupByResellerType = originResellerData.reduce((acc, item) => {
    // 查找是否已存在相同 type 的分组
    const existingGroup = acc.find((group) => group.type === item.type);

    if (existingGroup) {
      // 如果存在，往 resellerData 里追加
      existingGroup.resellerData.push({
        resellerImg: item.resellerImg,
        toUrl: item.toUrl,
      });
    } else {
      // 如果不存在，新建一个分组
      acc.push({
        resellerTit: item.resellerTit,
        type: item.type,
        resellerData: [
          {
            resellerImg: item.resellerImg,
            toUrl: item.toUrl,
          },
        ],
      });
    }

    return acc;
  }, []);
  // console.log(groupByResellerType, 'groupByResellerType');
  const { language } = getLocaleFromPath();
  groupByResellerType.forEach((item) => {
    // reseller Item dom
    const resellerItemBox = document.createElement('div');
    resellerItemBox.className = 'reseller-item-box';
    const resellerTit = document.createElement('div');
    // reseller 标题
    resellerTit.className = 'reseller-tit';
    resellerTit.textContent = item.resellerTit;
    // reseller item 数据
    const resellerDataDom = document.createElement('div');
    resellerDataDom.className = 'reseller-data';
    item.resellerData.forEach((resellerDataItem) => {
      const itemDataDom = document.createElement('div');
      itemDataDom.className = 'reseller-data-item';
      const itemDataImg = document.createElement('img');
      itemDataImg.className = 'data-item-img';
      itemDataImg.src = resellerDataItem.resellerImg;
      const itemDataBtn = document.createElement('div');
      itemDataBtn.className = 'data-item-btn';
      if (item.type === 'online') {
        itemDataBtn.textContent = translate('GOTOSHOP', language);
      } else {
        itemDataBtn.textContent = translate('FINDSTORE', language);
      }
      itemDataBtn.setAttribute('data-url', resellerDataItem.toUrl);
      itemDataBtn.addEventListener('click', () => {
        window.location.href = resellerDataItem.toUrl;
      });
      // itemDataBtn.href = resellerDataItem.toUrl;
      itemDataDom.append(itemDataImg, itemDataBtn);
      resellerDataDom.append(itemDataDom);
    });
    resellerItemBox.append(resellerTit, resellerDataDom);
    // console.log(resellerPopupBoxEl);
    resellerPopupBoxEl.append(resellerItemBox);
  });
}

/**
 * 【where to buy】经销商 popup dom 初始化
 * @param {*} popupParentEl 弹窗可追加位置的父元素
 */

export function whereResellerPopupDomInit(popupParentEl) {
  const { country } = getLocaleFromPath();
  const resellerMask = document.createElement('div');
  resellerMask.className = 'reseller-mask';
  const resellerPopupWrapper = document.createElement('div');
  resellerPopupWrapper.className = 'reseller-popup-wrapper';
  const resellerPopupBox = document.createElement('div');
  resellerPopupBox.className = 'reseller-popup-box';
  const resellerClose = document.createElement('img');
  resellerClose.className = 'reseller-close';
  resellerClose.src = `/content/dam/hisense/${country}/common-icons/close-50.svg`;
  resellerClose.addEventListener('click', () => {
    resellerMask.classList.remove('reseller-show');
    document.body.style.overflow = 'auto';
  });
  // reseller Item dom
  // const resellerItemBox = document.createElement('div');
  // resellerItemBox.className = 'reseller-item-box';
  // const resellerTit = document.createElement('div');
  // resellerTit.className = 'reseller-tit';
  // const resellerData = document.createElement('div');
  // resellerData.className = 'reseller-data';
  // resellerItemBox.append(resellerTit, resellerData);

  // resellerPopupBox.append(resellerItemBox);
  resellerPopupWrapper.append(resellerClose, resellerPopupBox);
  resellerMask.append(resellerPopupWrapper);
  // 将 reseller 弹窗追加到 【where to buy】按钮的父级元素中
  popupParentEl.append(resellerMask);
  whereResellerShowDataUtil(resellerPopupBox);
}
