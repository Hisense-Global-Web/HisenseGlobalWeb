import { createElement } from "../../utils/dom-helper";

export default async function decorate(block) {
  const textContainer = createElement('div', 'text-container');
  [...block.children].forEach(child => {
    if (child.querySelector('picture')) child.setAttribute('class','banner-image');
    else {
      textContainer.append(...child.firstElementChild);
      block.append(textContainer);
    }
  })
}