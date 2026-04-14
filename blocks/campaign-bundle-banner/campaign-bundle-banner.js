export default function decorate(block) {
  console.log('block', block);
  // const fifaContainerWrapper = document.createElement('div');
  // fifaContainerWrapper.className = 'fifa-container';
  // const bannerImgWrapper = document.createElement('div');
  // bannerImgWrapper.className = 'fifa-img-wrapper';
  // const bannerContentWrapper = document.createElement('div');
  // bannerContentWrapper.className = 'fifa-content-wrapper';
  // const bannerTextBox = document.createElement('div');
  // bannerTextBox.className = 'fifa-text-box';
  // const productContainer = document.createElement('div');
  // productContainer.className = 'product-container';

  // function imgDescriptionEl(row) {
  //   const productAllPEl = row.querySelectorAll('p');
  //   productAllPEl.forEach((child, subIndex) => {
  //     if (subIndex === 0) {
  //       child.className = 'product-series';
  //     } else if (subIndex === 1) {
  //       child.className = 'product-name';
  //     } else {
  //       child.className = 'product-btn';
  //     }
  //   });
  //   productContainer.append(row);
  // }

  // [...block.children].forEach((row, idx) => {
  //   switch (idx) {
  //     case 0:
  //       row.className = 'fifa-pc-banner';
  //       break;
  //     case 1:
  //       row.className = 'fifa-mobile-banner';
  //       break;
  //     case 2: {
  //       row.className = 'fifa-top-title';
  //       const titleAllPEl = row.querySelectorAll('p');
  //       titleAllPEl.forEach((child, subIndex) => {
  //         if (subIndex === 0) {
  //           child.className = 'top-title';
  //         } else {
  //           child.className = 'top-subtitle';
  //         }
  //       });
  //       break;
  //     }
  //     case 3: {
  //       row.className = 'fifa-left-content';
  //       const leftAllPEl = row.querySelectorAll('p');
  //       leftAllPEl.forEach((child, subIndex) => {
  //         if (subIndex === 0) {
  //           child.className = 'left-title';
  //         } else if (subIndex === 1) {
  //           child.className = 'left-subtitle';
  //         } else {
  //           child.className = 'left-btn';
  //         }
  //       });
  //       break;
  //     }
  //     case 4:
  //       row.className = 'fifa-tv-box fifa-product-box';
  //       imgDescriptionEl(row);
  //       break;
  //     case 5:
  //       row.className = 'fifa-canvas-box fifa-product-box';
  //       imgDescriptionEl(row);
  //       break;
  //     default:
  //       break;
  //   }
  //   if (idx < 2) {
  //     // 整合image 容器
  //     bannerImgWrapper.appendChild(row);
  //   } else if (idx === 2) {
  //     // 将banner 顶部标题直接追加到 bannerContentWrapper 容器中
  //     bannerContentWrapper.appendChild(row);
  //   } else {
  //     // 整合banner 中左右展示信息内容
  //     if (idx === 3) {
  //       bannerTextBox.appendChild(row);
  //     }
  //     bannerTextBox.append(productContainer);
  //     bannerContentWrapper.appendChild(bannerTextBox);
  //   }
  // });
  // fifaContainerWrapper.append(bannerImgWrapper, bannerContentWrapper);
  // block.appendChild(fifaContainerWrapper);
}
