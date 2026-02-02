export default async function decorate(block) {
  const textContainer = document.createElement('div');
  const isCompanyPage = window.location.pathname.includes('company-page');
  if (isCompanyPage) {
    const height =  window.innerWidth > 860 ? '166px' : '112px';
    document.documentElement.style.setProperty('--nav-height', height);
  }
  [...block.children].forEach(child => {
    if (child.querySelector('picture')) child.setAttribute('class','banner-image');
    else {
      textContainer.append(...child.firstElementChild.children);
      textContainer.setAttribute('class','text-container h-grid-container');
      block.replaceChild(textContainer, child);
    }
  })
}