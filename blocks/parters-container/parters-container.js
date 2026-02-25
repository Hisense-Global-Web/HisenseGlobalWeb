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
    iconList.forEach((icon) => {
      icon.classList.add('parters-container-icon-item');
      icon.querySelector('img')?.classList.add('parters-container-icon-item-img');
      iconWrapper.appendChild(icon);
    });
    title.parentNode.insertBefore(iconWrapper, highlightText);
  }
  highlightText.classList.add('parters-container-highlight-text');
  content.classList.add('parters-container-content');
}
