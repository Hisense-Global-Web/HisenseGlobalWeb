export default function decorate(block) {
  try {
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
