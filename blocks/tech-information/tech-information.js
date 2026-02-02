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
    // const infoImageDiv = document.createElement('div');
    // infoImageDiv.className = 'tech-image';
    // const cols = [...row.children];
    // console.log(cols, 'cols')
    // // hide the first p element in each column, which is only for content management use
    // cols.forEach((col) => {
    //   console.log(col, 'col')
    //   console.log(col.querySelector('div:first-child'), 'col div:first-child')
    //   const colPFirst = col.querySelector('div:first-child p:first-child');
    //   console.log(colPFirst, 'colPFirst')
    //   if (colPFirst) {
    //     colPFirst.style.display = 'none';
    //     console.log(colPFirst.textContent, 'className')
    //     col.parentElement.classList.add(colPFirst.textContent);
    //   }
    // })
    switch (index) {
      case 0:
        row.className = 'tech-img-wrapper';
        break;
      case 1:
        row.className = 'tech-text-wrapper';
        infoTextDiv.appendChild(row);
        break;
      case 2:
        techCtaDom.appendChild(row);
        break;
      default:
        row.className = 'tech-item-box';
        techItemWrapperDom.appendChild(row);
        break;
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

  // console.log(infoTextDiv, 'out')
  // const techInfoWrapper = block.querySelector('.component-tech-info');
  // const techImageWrapper = block.querySelector('.component-tech-img');
  // const techBtnWrapper = block.querySelector('.component-tech-btn');
  // const techItemWrapper = block.querySelector('.component-tech-items');
  // console.log(infoTextDiv, 'in')
  // infoTextDiv.append(techInfoWrapper, techItemWrapper, techBtnWrapper);
  // block.append(infoTextDiv);

  // if (techImageWrapper) {
  //   techImageWrapper.classList.add('tech-img-wrapper');
  //   block.prepend(techImageWrapper);
  // }
}
