export default async function decorate(block) {
  const MateEl = document.createElement('div');
  [...block.children].forEach((child) => {
    const type = child.firstElementChild.textContent;
    console.log(type);
    MateEl.className = 'article-meta-group';
    if (type === 'title-content' || type === 'subtitle-content') {
      child.setAttribute('class', child.firstElementChild.textContent);
      child.firstElementChild.remove();
    } else if (type === 'article-date' || type === 'article-location') {
      child.setAttribute('class', child.firstElementChild.textContent);
      child.firstElementChild.remove();
      MateEl.appendChild(child);
    }
  });
  block.appendChild(MateEl);
}
