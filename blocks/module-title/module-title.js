export default async function decorate(block) {
  [...block.children].forEach((child) => {
    child.setAttribute('class', child.firstElementChild.textContent);
    child.firstElementChild.remove();
  });

  // module title text align type
  const textAlignType = document.querySelector('.text-align-type p').innerHTML;
  if (textAlignType) {
    document.querySelector('.text-align-type').parentElement.classList.add(textAlignType);
    document.querySelector('.text-align-type').remove();
  }
}
