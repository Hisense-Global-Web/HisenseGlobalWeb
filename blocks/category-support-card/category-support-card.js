export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      console.log(element);
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Quick Action block decoration error:', error);
  }
}
