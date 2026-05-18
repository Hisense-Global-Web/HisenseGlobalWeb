export default function decorate(block) {
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

  [...block.children].forEach((row) => {
    // console.log('row', row);
    const key = row.children[0].textContent.trim();
    row.className = key;
    if (row.className === 'fifa-image' || row.className === 'fifa-mobile-image') {
      // 图片部分，包含pc端和移动端图片
      bannerImgWrapper.append(row);
      row.children[0].remove();
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
      if (row.classList.contains('left-cta-text')) {
        fifaLeftContent.querySelector('.left-cta a').textContent = row.textContent.trim();
        row.remove();
      }
    } else {
      // 右侧产品信息展示，包含系列、名称和按钮
      row.className = 'fifa-product-box';
      [...row.children].forEach((child, subIndex) => {
        if (subIndex === 0) {
          child.className = 'product-series';
        } else if (subIndex === 1) {
          child.className = 'product-name';
        } else {
          child.className = 'product-btn';
        }
      });
      productContainer.append(row);
      bannerTextBox.append(productContainer);
    }
  });

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
  //       // titleAllPEl.forEach((child, subIndex) => {
  //       //   if (subIndex === 0) {
  //       //     child.className = 'top-title';
  //       //   } else {
  //       //     child.className = 'top-subtitle';
  //       //   }
  //       // });
  //       break;
  //     }
  //     case 3: {
  //       row.className = 'fifa-left-content';
  //       console.log('row', row);
  //       // const key = row.children[0].textContent.trim();
  //       // row.className = key;
  //       const leftAllPEl = row.querySelectorAll('p');
  //       leftAllPEl.forEach((child, subIndex) => {
  //         console.log('child', child);
  //         // const key = child.textContent.trim();
  //         // child.className = key;
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
  block.append(bannerImgWrapper, bannerContentWrapper);
}
