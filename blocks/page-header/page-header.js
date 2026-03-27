import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';

export default function decorate(block) {
  try {
    const [pageHeaderStyleEl, titleStyleEl, titleEl, subtitleEl] = [...block.children];
    const pageHeaderStyle = pageHeaderStyleEl.querySelector('p')?.textContent ?? 'align-center';
    block.classList.add(pageHeaderStyle);
    const titleStylePEl = titleStyleEl?.querySelector?.('p') ?? null;
    if (titleStylePEl) {
      titleEl.classList.add(titleStylePEl?.textContent);
    }
    titleEl.classList.add('page-header-title');
    if (subtitleEl) {
      subtitleEl?.classList.add('page-header-subtitle');
    }
    pageHeaderStyleEl.remove();
    titleStyleEl?.remove();
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Page Header block decoration error:', error);
  } finally {
    getDynamicHeaderHeight(block);
  }
}
