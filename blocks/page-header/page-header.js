export default function decorate(block) {
  try {
    const isCompanyPage = window.location.pathname.includes('company');
    const isSupport = window.location.pathname.includes('support');
    if (isCompanyPage) {
      const height = window.innerWidth >= 1180 ? '166px' : '112px';
      document.documentElement.style.setProperty('--nav-height', height);
    } else if (isSupport) {
      const height = window.innerWidth >= 1180 ? '100px' : '112px';
      document.documentElement.style.setProperty('--nav-height', height);
    }
    const [titleStyleEl, titleEl, subtitleEl] = [...block.children];
    const titleStylePEl = titleStyleEl?.querySelector?.('p') ?? null;
    if (titleStylePEl) {
      titleEl.classList.add(titleStylePEl?.textContent);
    }
    titleEl.classList.add('page-header-title');
    if (subtitleEl) {
      subtitleEl?.classList.add('page-header-subtitle');
    }
    titleStyleEl?.remove();
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Page Header block decoration error:', error);
  }
}
