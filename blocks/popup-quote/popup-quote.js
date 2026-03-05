const country = window.location.pathname.split('/').filter(Boolean)[0] || '';
export default function decorate(block) {
  [...block.children].forEach((child) => {
    child.setAttribute('class', child.firstElementChild.textContent);
    child.firstElementChild.remove();
  });
  const imgEl = document.createElement('img');
  imgEl.className = 'quotation';
  imgEl.src = `/content/dam/hisense/${country}/common-icons/quotation.svg`;
  imgEl.alt = 'quotation';
  block.append(imgEl);
}
