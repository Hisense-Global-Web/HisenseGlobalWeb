export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('category-support-card-item');
      const [icon, description, link] = element.children;
      icon?.classList?.add('category-support-card-item-icon');
      description?.classList?.add('category-support-card-item-description');
      const linkUrl = link.querySelector('a') ? link.querySelector('a').href : '#';
      link?.remove();
      element.addEventListener('click', () => {
        window.location.href = linkUrl;
      });
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Category Support Card block decoration error:', error);
  }
}
