export default function decorate(block) {
  try {
    const [title, subtitle] = block.querySelectorAll('p');
    title.classList.add('support-module-title-title');
    // If subtitle exists
    if (subtitle) {
      // Check if subtitle is empty
      if (subtitle?.innerHTML?.trim() === '') {
        subtitle.remove();
      } else {
        subtitle.classList.add('support-module-title-subtitle');
      }
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Section Title block decoration error:', error);
  }
}
