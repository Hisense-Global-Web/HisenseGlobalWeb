export default function decorate() {
  try {
    const [textStyleEl, titleContainerEl] = document.querySelector('.support-module-title')?.children ?? [];
    const textStyle = textStyleEl.querySelector('p').textContent;
    const isCenter = textStyle === 'center' ?? false;
    textStyleEl.remove();
    const [titleEl, subtitleEl] = titleContainerEl.querySelectorAll('p');
    titleEl.classList.add('support-module-title-title');
    if (isCenter) {
      titleEl.classList.add('text-center');
    }
    if (subtitleEl) {
      subtitleEl.classList.add('support-module-title-subtitle');
      if (isCenter) {
        subtitleEl.classList.add('text-center');
      }
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Support Module Title block decoration error:', error);
  }
}
