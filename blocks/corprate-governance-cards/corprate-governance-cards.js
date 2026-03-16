export default function decorate(block) {
  block.id = 'corprate-governance-cards';
  if (!block.firstElementChild.textContent.trim()) return;
  const gContainer = document.createElement('div');
  gContainer.classList.add('g-container');
  [...block.children].forEach((cardItem) => {
    cardItem.classList.add('card-item');
    if (!cardItem.children.length) return;
    const [iconDiv, title, text, linkDiv] = cardItem.children;
    iconDiv?.classList.add('icon-div');
    const textContent = document.createElement('div');
    textContent.classList.add('text-content');
    textContent.append(title, text);
    title?.classList.add('title');
    text?.classList.add('text');
    if (!title?.textContent.trim() && !text?.textContent.trim()) {
      textContent.classList.add('no-text');
    }
    cardItem.insertBefore(textContent, linkDiv);
    linkDiv?.querySelectorAll('a').forEach((button) => {
      button.closest('div').classList.add('link-div');
      button.textContent = button.nextElementSibling?.textContent || button.parentElement.nextElementSibling.textContent;
      button.title = button.textContent;
      button.nextElementSibling?.remove();
      button.parentElement?.nextElementSibling?.remove();
    });
    if (!linkDiv.textContent.trim()) {
      linkDiv.remove();
    }
    gContainer.append(cardItem);
  });
  block.replaceChildren(gContainer);
}
