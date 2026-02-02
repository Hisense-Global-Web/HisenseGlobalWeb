export default async function decorate(block) {
  // block.classList.add('h-grid-container');
  const textContainer = document.createElement('div');
  [...block.children].forEach((child, index) => {
    if (child.querySelector('picture')) child.setAttribute('class', 'gradient-image');
    else {
      switch (index) {
        case 1:
          child.firstElementChild?.classList.add('subtitle');
          textContainer.append(child.firstElementChild);
          break;
        case 2:
          child.firstElementChild?.classList.add('title');
          textContainer.append(child.firstElementChild);
          break;
        case 3:
          child.firstElementChild?.classList.add('text');
          textContainer.append(child.firstElementChild);
          break;
        default:
          break;
      }
      if (!child.textContent.trim()) child.remove();
    }
    textContainer.classList.add('text-container');
    block.append(textContainer);
  });
}
