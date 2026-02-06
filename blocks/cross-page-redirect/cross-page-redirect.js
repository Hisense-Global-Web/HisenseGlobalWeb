export default function decorate(block) {
  const [headline, bodyCopy, button] = block.children;
  const textContainer = document.createElement('div');
  textContainer.classList.add('text-container');
  textContainer.append(headline, bodyCopy);
  headline.classList.add('headline');
  bodyCopy.classList.add('bodyCopy');
  button.classList.add('button-container');
  block.prepend(textContainer);
  button.querySelector('a').textContent = button.firstElementChild?.lastElementChild?.textContent;
  button.querySelector('a').classList.add(`bg-${button.firstElementChild?.firstElementChild?.textContent}`);
  button.firstElementChild?.firstElementChild?.remove();
  button.firstElementChild?.lastElementChild?.remove();
}
