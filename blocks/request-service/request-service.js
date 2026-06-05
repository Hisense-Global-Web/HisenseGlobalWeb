const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';
const generateChevronIcon = () => {
  const chevronIcon = document.createElement('div');
  chevronIcon.className = 'chevron-icon';
  const iconImg = document.createElement('img');
  iconImg.src = `/content/dam/hisense/${country}/common-icons/chevron-right.svg`;
  iconImg.setAttribute('aria-hidden', 'true');
  iconImg.loading = 'lazy';
  chevronIcon.appendChild(iconImg);
  return chevronIcon;
};

export default function decorate(block) {
  const requestServiceList = [...block.children] ?? [];
  if (requestServiceList?.length) {
    requestServiceList.forEach((recallInfo, index) => {
      recallInfo.classList.add('request-service-item');
      const [textContentEl, buttonEl, buttonLinkEl] = recallInfo?.children ?? [];
      textContentEl.classList.add('title-wrapper');
      const [titleEl, contentEl] = textContentEl?.children ?? [];
      if (titleEl) {
        titleEl.classList.add('title');
      }
      if (contentEl) {
        contentEl.classList.add('content');
      }
      const buttonLink = buttonLinkEl.querySelector('a')?.textContent ?? null;
      buttonLinkEl?.remove();
      if (!buttonEl?.children?.length || !buttonLink) {
        buttonEl?.remove();
      } else {
        buttonEl.appendChild(generateChevronIcon());
        buttonEl.classList.add('button');
        if (buttonLink) {
          buttonEl.addEventListener('click', () => {
            window.location.href = buttonLink;
          });
        }
      }
      if (index < requestServiceList.length - 1) {
        const divideLineEl = document.createElement('div');
        divideLineEl.className = 'divide-line';
        recallInfo.after(divideLineEl);
      }
    });
  }
}
