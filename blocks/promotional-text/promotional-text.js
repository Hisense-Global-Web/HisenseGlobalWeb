export default function decorate(block) {
  const [fontColorEl, textAlignEl, titleEl, subtitleEl, contentEl] = [...block.children] ?? [];
  const fontColor = fontColorEl?.querySelector('p')?.textContent ?? 'green60';
  const textAlign = textAlignEl?.querySelector('p')?.textContent ?? 'align-center';
  block.classList.add(fontColor, textAlign);
  fontColorEl?.remove?.();
  textAlignEl?.remove?.();
  if (titleEl) {
    titleEl.classList.add('title');
  }
  if (subtitleEl) {
    subtitleEl.classList.add('subtitle');
  }
  if (contentEl) {
    contentEl.classList.add('content');
  }
}
