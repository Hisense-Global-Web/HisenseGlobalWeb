export default function decorate(block) {
  [...block.children].forEach((row, idx) => {
    if (idx === 0) {
      row.className = 'pc-box-img';
      const ctaContainerEl = document.createElement('div');
      ctaContainerEl.className = 'cta-container';
      [...row.children].forEach((column) => {
        column.append(ctaContainerEl);
        [...column.children].forEach((subEl, subIndex) => {
          if (subIndex > 0 && subEl.classList.contains('button-container')) {
            ctaContainerEl.appendChild(subEl);
          }
        });
        const ctaArrDom = column.querySelectorAll('.cta-container .button-container');
        if (ctaArrDom.length > 1) {
          ctaArrDom[0].classList.add('green-btn');
        }
      });
    } else {
      row.className = 'mobile-box-img';
    }
  });
}
