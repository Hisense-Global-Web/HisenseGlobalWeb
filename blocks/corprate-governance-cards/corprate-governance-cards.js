export default function decorate(block) {
  block.id = 'coprate-governance-cards';
  [...block.children].forEach(cardItem => {
    const [iconDiv, title, text, linkDiv] = cardItem.children;
    iconDiv?.classList.add('icon-div');
    const textContent = document.createElement('div');
    textContent.classList.add('text-content');
    textContent.append(title, text);
    title?.classList.add('title');
    text?.classList.add('text');
    linkDiv?.querySelectorAll('a').forEach(button => {
      button.closest('div').classList.add('link-div');
      button.textContent = button.nextElementSibling?.textContent || button.parentElement.nextElementSibling.textContent;
      button.nextElementSibling?.remove();
      button.parentElement?.nextElementSibling?.remove();
    });
  })
}
