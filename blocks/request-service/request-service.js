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
      if (!buttonEl?.children?.length) {
        buttonEl?.remove();
      } else {
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
