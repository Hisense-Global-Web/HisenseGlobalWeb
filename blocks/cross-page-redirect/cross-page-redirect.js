export default function decorate(block) {
  const [headline, bodyCopy, button, subscription] = block.children;
  const textContainer = document.createElement('div');
  textContainer.classList.add('text-container');
  textContainer.append(headline, bodyCopy);
  headline.classList.add('title');
  bodyCopy.classList.add('text');
  block.prepend(textContainer);
  button.classList.add('button-container');
  const btn = button.querySelector('a');
  if (btn) {
    btn.textContent = button.firstElementChild?.lastElementChild?.textContent;
    btn.title = btn.textContent;
    btn.classList.add(`bg-${button.firstElementChild?.firstElementChild?.textContent}`);
  }
  button.firstElementChild?.firstElementChild?.remove();
  button.firstElementChild?.lastElementChild?.remove();

  const isThirdPartyScript = subscription?.textContent.trim() || '';
  subscription?.classList.add(`${isThirdPartyScript ? 'is-thrid-party' : 'no-third-party'}`);
  if (isThirdPartyScript) {
    button.remove();
  }
}
