export default async function decorate(block) {
  const textWrapperEl = document.createElement('div');
  textWrapperEl.className = 'tech-item-wrapper';
  [...block.children].forEach((row) => {
    row.className = 'tech-item-box';
    textWrapperEl.appendChild(row);
  });
  block.appendChild(textWrapperEl);

  // Assign class names to children in tech-item-box and get style
  const popupKeyStatsBlockAll = document.querySelectorAll('.popup-key-stats');
  popupKeyStatsBlockAll.forEach((blockEl) => {
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
}
