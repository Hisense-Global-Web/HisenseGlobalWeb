export default function decorate(block) {
    const [ headline, bodyCopy, button ] = block.children;
    const textContainer = document.createElement('div');
    textContainer.classList.add('textContainer');
    textContainer.append(headline,bodyCopy);
    headline.classList.add('headline');
    bodyCopy.classList.add('bodyCopy');
    button.classList.add('button-container');
    block.prepend(textContainer);
    button.querySelector('a').textContent = button.firstElementChild.lastElementChild.textContent;
    button.firstElementChild.lastElementChild.remove();
}