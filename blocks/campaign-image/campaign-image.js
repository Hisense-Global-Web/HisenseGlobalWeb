export default function decorate(block) {
  const [bgPCEl, bgMobileEl, footballEl, leftCloseEl, rightContentEl] = [...block.children] ?? [];
  bgPCEl.classList.add('background-pc');
  bgMobileEl.classList.add('background-mobile');
  footballEl?.classList?.add('football');
  const contentWrapperEl = document.createElement('div');
  contentWrapperEl.classList.add('content-wrapper');
  leftCloseEl?.classList?.add('left-close');
  rightContentEl.classList.add('right-content');
  const [titleEl, textEl, btnTextEl, btnLinkEl] = rightContentEl.children?.[0]?.children ?? [];
  titleEl?.classList?.add('title');
  textEl?.classList?.add('text');
  btnTextEl?.classList?.add('button');
  const btnLink = btnLinkEl?.querySelector?.('a')?.href ?? null;
  btnLinkEl?.remove?.();
  if (btnLink) {
    btnTextEl.addEventListener('click', () => {
      window.location.href = btnLink;
    });
  }

  contentWrapperEl.appendChild(leftCloseEl);
  contentWrapperEl.appendChild(rightContentEl);
  block.appendChild(contentWrapperEl);
}
