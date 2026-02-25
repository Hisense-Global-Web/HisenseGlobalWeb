export default async function decorate(block) {
  const [title, text, highlightText, content, ...iconList] = [...block.children];
  title.classList.add('parters-container-title');
  text.classList.add('parters-container-text');
  const textDiv = document.createElement('div');
  textDiv.className = 'parters-container-text';
  textDiv.textContent = text;
  const iconSrcList = [];
  iconList.forEach((icon) => {
    iconSrcList.push(icon.querySelector('img')?.src || '');
  });
  if (iconSrcList?.length) {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'parters-container-icon-wrapper';
    iconSrcList.forEach((src) => {
      const iconItem = document.createElement('div');
      iconItem.className = 'parters-container-icon-item';
      const icon = document.createElement('img');
      icon.className = 'parters-container-icon-item-img';
      icon.src = src;
      iconItem.appendChild(icon);
      iconWrapper.appendChild(iconItem);
    });
    title.parentNode.insertBefore(iconWrapper, highlightText);
    iconList.forEach((icon) => icon.remove());
  }
  highlightText.classList.add('parters-container-highlight-text');
  content.classList.add('parters-container-content');
  const highlightTextDiv = document.createElement('div');
  highlightTextDiv.className = 'parters-container-highlight-text';
  highlightTextDiv.textContent = highlightText;
  const contentDiv = document.createElement('div');
  contentDiv.className = 'parters-container-content';
  contentDiv.textContent = content;
}
