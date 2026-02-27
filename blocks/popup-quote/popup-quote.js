export default function decorate(block) {
  [...block.children].forEach((child) => {
    child.setAttribute('class', child.firstElementChild.textContent);
    child.firstElementChild.remove();
  });
  const imgEl = document.createElement('img');
  imgEl.className = 'quotation';
  imgEl.src = '/content/dam/hisense/us/common-icons/quotation.svg';
  imgEl.alt = 'quotation';
  block.append(imgEl);
}
