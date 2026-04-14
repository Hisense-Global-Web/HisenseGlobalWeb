export default function decorate(block) {
  const [bgPCEl, bgMobileEl, footballEl, alignEl, contentEl] = [...block.children] ?? [];
  // const bgPCImage = bgPCEl?.querySelector?.('img')?.src;
  // const bgMobileImage = bgMobileEl?.querySelector?.('img')?.src;
  // bgPCEl?.remove();
  // bgMobileEl?.remove();
  bgPCEl.classList.add('background-pc');
  bgMobileEl.classList.add('background-mobile');
  // const meidaQuery = window.matchMedia('(min-width: 860px)');

  // const handleMediaChange = (e) => {
  //   if (e.matches) {
  //     if (bgPCImage) { // PC
  //       // block.style.backgroundImage = `url(${bgPCImage})`;
  //     }
  //   } else {
  //     // eslint-disable-next-line no-lonely-if
  //     if (bgMobileImage) { // Mobile
  //       // block.style.backgroundImage = `url(${bgMobileImage})`;
  //     }
  //   }
  // };

  // handleMediaChange(meidaQuery);

  const align = alignEl?.querySelector('p')?.textContent ?? 'right';
  footballEl?.classList?.add('football');
  alignEl?.remove?.();
  contentEl.classList.add('content', align);
  const [titleEl, textEl, btnTextEl, btnLinkEl] = contentEl.children?.[0]?.children ?? [];
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
}
