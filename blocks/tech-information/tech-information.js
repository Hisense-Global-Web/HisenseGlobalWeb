import { popupShowUtils } from '../../utils/section-popup-utils.js';

export default async function decorate(block) {
  // console.log(block, 'bb');
  // Create a wrapper for tech items
  const techItemWrapperDom = document.createElement('div');
  techItemWrapperDom.className = 'tech-item-wrapper';
  const techCtaDom = document.createElement('div');
  techCtaDom.className = 'tech-cta-wrapper';
  const infoTextDiv = document.createElement('div');
  infoTextDiv.className = 'tech-info-container';
  [...block.children].forEach((row, index) => {
    switch (index) {
      case 0: {
        row.className = 'tech-img-wrapper';
        row.firstElementChild.className = 'tech-img-box';
        break;
      }
      case 1: {
        row.className = 'tech-text-wrapper';
        infoTextDiv.appendChild(row);
        break;
      }
      case 2: {
        techCtaDom.appendChild(row);
        techCtaDom.querySelector('p:first-child').className = 'cta-button';
        if (techCtaDom.querySelector('p:nth-child(2')) {
          const popupId = techCtaDom.querySelector('p:nth-child(2').innerText;
          techCtaDom.querySelector('p:first-child').setAttribute('data-id', popupId);
          techCtaDom.querySelector('p:nth-child(2').remove();
        }
        // const toggleExpand = (e) => {
        //   e.stopPropagation();
        //   console.log(e.target.dataset.id, 'eeeeee')
        //   // 获取目标 data-id 值
        //   const ctaId = e.target.dataset.id;
        //    // 方法1：使用属性选择器查找对应的 a 元素
        //   const targetPopup = document.querySelector(`.section-popup-container-container[data-id="${ctaId}"]`);
        //   if (targetPopup) {
        //     // 先隐藏所有 a 元素
        //     document.querySelectorAll('.section-popup-container-container').forEach(popupItem => {
        //         popupItem.classList.remove('popup-show');
        //     });

        //     document.body.style.overflow = 'hidden';
        //     // 显示目标 a 元素
        //     targetPopup.classList.add('popup-show');
        //   }
        // };

        techCtaDom.querySelector('p:first-child').addEventListener('click', popupShowUtils);
        break;
      }
      default: {
        row.className = 'tech-item-box';
        techItemWrapperDom.appendChild(row);
        break;
      }
    }
  });
  // Append tech items and CTA to info text div
  infoTextDiv.append(techItemWrapperDom, techCtaDom);
  block.append(infoTextDiv);

  const techImgBoxPAll = block.querySelectorAll('.tech-img-box p');
  techImgBoxPAll.forEach((imgP, imgIdx) => {
    if (imgIdx === 0) {
      imgP.className = 'tech-pc-img';
    } else {
      imgP.className = 'tech-mobile-img';
    }
  });

  // Assign class names to p elements in tech-text-wrapper
  const textWrapperPAll = block.querySelectorAll('.tech-text-wrapper p');
  textWrapperPAll.forEach((p, idx) => {
    if (idx === 0) {
      p.className = 'tech-info-title';
    } else if (idx === 1) {
      p.className = 'tech-info-subtitle';
    } else {
      p.className = 'tech-info-text';
    }
  });

  // Assign class names to children in tech-item-box and get style
  const techInformationBlockAll = document.querySelectorAll('.tech-information');
  techInformationBlockAll.forEach((blockEl) => {
    // console.log(blockEl, 'blockEl');
    const techItemBoxAll = blockEl.querySelectorAll('.tech-item-wrapper .tech-item-box');
    const techItemWrapperEl = blockEl.querySelector('.tech-item-wrapper');
    let techItemStyle = '';
    techItemBoxAll.forEach((box) => {
      const itemBoxChildren = [...box.children];
      itemBoxChildren.forEach((item, idx) => {
        if (idx === 0) {
          techItemStyle = item.textContent;
          item.className = 'tech-item-style';
        } else if (idx === 1) {
          item.className = 'tech-item-icon';
        } else {
          item.className = 'tech-item-text-content';
        }
      });
    });
    if (techItemWrapperEl) {
      techItemWrapperEl.classList.add(techItemStyle);
    }
  });
  // const techItemStyleDom = document.querySelectorAll('.tech-item-style');
  // techItemStyleDom.forEach((item) => {
  //   item.remove();
  // });
}
