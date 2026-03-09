import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';

export default function decorate(block) {
  try {
    getDynamicHeaderHeight(block);
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
