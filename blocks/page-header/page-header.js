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
    const elementItems = [...block.children];
    elementItems.forEach((element, index) => {
      if (index === 0) {
        element?.classList.add('page-header-title');
      } else if (index === 1) {
        element?.classList.add('page-header-subtitle');
      }
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Page Header block decoration error:', error);
  }
}
