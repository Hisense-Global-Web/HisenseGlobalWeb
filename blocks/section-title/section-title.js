export default function decorate(block) {
  try {
    const [title, subtitle] = block.querySelectorAll('p');
    title.classList.add('section-title-title');
    if (subtitle.innerHTML.trim() === '') {
      subtitle.remove();
    } else {
      subtitle.classList.add('section-title-subtitle');
    }
  } catch (error) {
    console.error('Section Title block decoration error:', error);
  }
}
