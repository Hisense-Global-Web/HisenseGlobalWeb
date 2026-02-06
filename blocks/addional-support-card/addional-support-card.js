export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('addional-support-card-item');
      const [icon, title, subtitle, buttonLink, buttonText] = element.children;
      icon?.classList?.add('addional-support-card-item-icon');
      title?.classList?.add('addional-support-card-item-title');
      subtitle?.classList?.add('addional-support-card-item-subtitle');
      buttonLink?.classList?.add('addional-support-card-item-link');
      buttonText?.classList?.add('addional-support-card-item-link-text');
      // buttonLink?.querySelector('a')?.classList?.add('addional-support-card-item-link-a');
      buttonLink.querySelector('a').innerHTML = buttonText?.querySelector('p')?.innerHTML || '';
      buttonText?.remove();
      // const linkUrl = link.querySelector('a') ? link.querySelector('a').href : '#';
      // link?.remove();
      // element.addEventListener('click', () => {
      //   window.location.href = linkUrl;
      // });
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Addional Support Card block decoration error:', error);
  }
}
