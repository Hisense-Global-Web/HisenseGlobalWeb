export default function decorate(block) {
  const [title, subtitle] = [...block.children];
  if (title?.querySelector('p')?.textContent?.length > 0) {
    title.classList.add('title');
  } else {
    title?.remove();
  }
  if (subtitle?.querySelector('p')?.textContent?.length > 0) {
    subtitle.classList.add('subtitle');
  } else {
    subtitle?.remove();
  }
}
