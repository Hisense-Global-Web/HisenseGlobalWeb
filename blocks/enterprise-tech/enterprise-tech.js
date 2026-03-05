const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
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
    [...row.children].forEach((column, colIndex) => {
      switch (colIndex) {
        case 0:
          column.className = 'pc-image-box';
          break;
        case 1:
          column.className = 'mobile-image-box';
          break;
        case 2:
          column.className = 'title-box';
          break;
        case 3:
          column.className = 'subtitle-box';
          infoBoxEl.append(column);
          break;
        default:
          column.className = 'description-box';
          infoBoxEl.append(column);
      }
      if (colIndex === 1) {
        const mobileArrowEl = document.createElement('div');
        mobileArrowEl.className = 'mobile-arrow';
        const arrowImg = document.createElement('img');
        arrowImg.src = `/content/dam/hisense/${country}/common-icons/chevron-white-up.svg`;
        arrowImg.alt = 'Arrow image';
        mobileArrowEl.append(arrowImg);

        const mobileTitBoxEl = document.createElement('div');
        mobileTitBoxEl.className = 'mobile-tit-box';
        // title-box element
        const titleBoxEl = row.children[2];
        mobileTitBoxEl.append(titleBoxEl, mobileArrowEl);
        mobileTitWrapperEl.append(column, mobileTitBoxEl);
        // mobile arrow add click event
        const toggleExpand = (e) => {
          e.stopPropagation();
          const grandParent = e.target.closest('.enterprise-card-box');
          if (!grandParent) { return; }
          grandParent.classList.toggle('info-hide');
        };

        mobileArrowEl.addEventListener('click', toggleExpand);
      }
    });
    row.append(mobileTitWrapperEl, infoBoxEl);
    enterpriseCardWrapperEl.append(row);
  });
  block.append(enterpriseCardWrapperEl);
}
