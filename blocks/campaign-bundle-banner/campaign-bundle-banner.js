import { readBlockConfig } from '../../scripts/aem.js';
import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  const bannerImgWrapper = document.createElement('div');
  bannerImgWrapper.className = 'fifa-img-wrapper';
  const topTitleWrapper = document.createElement('div');
  topTitleWrapper.className = 'fifa-top-title';
  const bannerContentWrapper = document.createElement('div');
  bannerContentWrapper.className = 'fifa-content-wrapper';
  const bannerTextBox = document.createElement('div');
  bannerTextBox.className = 'fifa-text-box';
  const fifaLeftContent = document.createElement('div');
  fifaLeftContent.className = 'fifa-left-content';
  const productContainer = document.createElement('div');
  productContainer.className = 'product-container';

  let isDynamicFlag = ''; // dynamic media 标识
  [...block.children].forEach((row) => {
    const key = row.children[0].textContent.trim();
    row.className = key;
    if (row.className === 'dynamic-media') {
      isDynamicFlag = row.children[1].textContent.trim();
      row.remove();
    } else if (row.className === 'fifa-image' || row.className === 'fifa-mobile-image') {
      // 图片部分，包含pc端和移动端图片
      if (row.className === 'fifa-image' && row.querySelector('a') && isDynamicFlag === 'true') {
        // dynamic media 图片
        const dynamicImgSrc = row.querySelector('a').getAttribute('href');
        row.append(createDynamicMediaPicture(dynamicImgSrc, 'collection-banner'));
        // 移除key dom 和 author 端返回的 dynamic media 图片链接的 a 标签
        const firstTwo = [...row.children].slice(0, 2);
        firstTwo.forEach((child) => child.remove());
        // PC 端 dynamic media dom 整合到 bannerImgWrapper 元素中
        bannerImgWrapper.append(row);
      } else if (row.className === 'fifa-mobile-image' && isDynamicFlag === 'true') {
        // 是dynamic media 图片时， mobile 图片直接克隆PC dom 中的 IMG DOM 展示是动态图片
        const pcImgDom = bannerImgWrapper.querySelector('.fifa-image');
        const clonePcImgDom = pcImgDom.cloneNode(true);
        clonePcImgDom.className = 'fifa-mobile-image';
        bannerImgWrapper.append(clonePcImgDom);
        // 把普通图片的mobile img dom 移除，只展示dynamic media dom
        row.remove();
      } else {
        // 普通图片直接把 pc img 和mobile img 组合到dom 元素 bannerImgWrapper 中
        bannerImgWrapper.append(row);
        row.children[0].remove();
      }
    } else if (row.className === 'top-title' || row.className === 'top-subtitle') {
      // 顶部标题部分，包含主标题和副标题
      topTitleWrapper.appendChild(row);
      bannerContentWrapper.appendChild(topTitleWrapper);
      row.children[0].remove();
    } else if (row.className === 'left-title' || row.className === 'left-subtitle' || row.className === 'left-cta' || row.className === 'left-cta-text') {
      // 左侧内容展示，包含标题、描述和按钮
      fifaLeftContent.appendChild(row);
      bannerTextBox.appendChild(fifaLeftContent);
      bannerContentWrapper.appendChild(bannerTextBox);
      row.children[0].remove();
      // 为cta 按钮添加链接和文本
      if (row.classList.contains('left-cta-text') && row.textContent.trim()) {
        fifaLeftContent.querySelector('.left-cta a').textContent = row.textContent.trim();
        row.remove();
      }
    } else {
      // 右侧产品信息展示，包含系列、名称和按钮，有且仅有两套产品信息展示
      const productBoxAll = productContainer.querySelectorAll('.fifa-product-box');
      if (productBoxAll.length < 2) {
        row.className = 'fifa-product-box';
        const productInfoBox = document.createElement('div');
        productInfoBox.className = 'product-info';
        [...row.children].forEach((child, subIndex) => {
          if (subIndex === 0) {
            child.className = 'product-series';
            productInfoBox.append(child);
          } else if (subIndex === 1) {
            child.className = 'product-name';
            productInfoBox.append(child);
          } else {
            child.className = 'product-btn';
          }
        });
        row.prepend(productInfoBox);
        productContainer.append(row);
        bannerTextBox.append(productContainer);
      } else {
        row.remove();
      }
    }
  });

  block.append(bannerImgWrapper, bannerContentWrapper);

  // 根据配置项决定是否展示左侧按钮
  if (!Object.keys(config).includes('left-cta-text')) {
    fifaLeftContent.querySelector('.left-cta')?.remove();
  }
}
