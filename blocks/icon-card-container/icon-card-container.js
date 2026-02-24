export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element?.classList?.add('icon-card-container-item');
      const [icon, title, subtitle] = element?.children ?? [];
      icon?.classList?.add('card-icon');
      title?.classList?.add('title');
      subtitle?.classList?.add('subtitle');
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Icon Card Container Card block decoration error:', error);
  }
}
