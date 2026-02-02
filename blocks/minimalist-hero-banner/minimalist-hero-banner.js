export default async function decorate(block) {
  const textContainer = document.createElement('div');
  [...block.children].forEach(child => {
    if (child.querySelector('picture')) child.setAttribute('class','banner-image');
    else {
      textContainer.append(...child.firstElementChild.children);
      textContainer.setAttribute('class','text-container h-grid-container');
      block.replaceChild(textContainer, child);
    }
  })
}