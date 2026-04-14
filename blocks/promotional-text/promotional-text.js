export default function decorate(block) {
  const [title, subtitle] = [...block.children] ?? [];
  if (title) {
    title.classList.add('title');
  } if (subtitle) {
    subtitle.classList.add('subtitle');
  }
}