export default function decorate(block) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const country = segments[segments[0] === 'content' ? 2 : 0] || '';
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    return;
  }
  [...block.children].forEach((card) => {
    card.classList.add('collapse-card');
    let showButton = false;
    [...card.children].forEach((row, index) => {
      if (index === 0) {
        row.classList.add('collapse-title');
        const icon = document.createElement('img');
        icon.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
        icon.alt = '';
        icon.className = 'chevron';
        icon.addEventListener('click', (e) => {
          e.stopPropagation();
          const collapseCard = e.currentTarget.closest('.collapse-card');
          if (collapseCard) {
            collapseCard.classList.toggle('hide');
          }
        });
      } else if (index === 1) {
        row.classList.add('collapse-context');
      } else if (index === 2) {
        if (row.textContent.trim() === 'true') {
          showButton = true;
        }
        row.remove();
      } else if (index === 3) {
        const btnEl = document.createElement('div');
        btnEl.classList.add('collapse-btn');
        if (showButton) {
          btnEl.textContent = row.children[0].textContent;
          btnEl.addEventListener('click', () => {
            window.location.href = row.children[1].querySelector('a').href;
          });
        } else {
          btnEl.classList.add('hide');
        }
        const contextEl = card.querySelector('.collapse-context');
        contextEl.appendChild(btnEl);
        row.remove();
      }
    });
  });
}
