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
        // const ctaLabel = row.querySelector('p:nth-child(2)').textContent;
        // const rowButtonEl = row.querySelector('a');
        // if (rowButtonEl) {
        //   rowButtonEl.textContent = ctaLabel;
        //   row.querySelector('p:nth-child(2)').remove();
        // }
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
    techItemWrapperEl.classList.add(techItemStyle);
  });
  const techItemStyleDom = document.querySelectorAll('.tech-item-style');
  techItemStyleDom.forEach((item) => {
    item.remove();
  });
  // const techItemBoxAll = block.querySelectorAll('.tech-item-wrapper .tech-item-box');
  // const techItemWrapperEl = document.querySelector('.tech-item-wrapper');
  // let techItemStyle = '';
  // techItemBoxAll.forEach((box) => {
  //   const itemBoxChildren = [...box.children];
  //   itemBoxChildren.forEach((item, idx) => {
  //     // console.log(item, 'item');
  //     if (idx === 0) {
  //       techItemStyle = item.textContent;
  //       // item.remove();
  //     } else if (idx === 1) {
  //       item.className = 'tech-item-icon';
  //     } else {
  //       item.className = 'tech-item-text-content';
  //     }
  //   });
  // });
  // console.log(techItemStyle, 'techItemStyle');
  // techItemWrapperEl.classList.add(techItemStyle);
}
