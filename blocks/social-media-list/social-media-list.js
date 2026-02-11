export default function decorate(block) {
  // social-media-list-item
  // const isEditMode = block.hasAttribute('data-aue-resource');
  // if (isEditMode) {
  //   return;
  // }
  [...block.children].forEach((row) => {
    row.classList.add('social-media-list-item');
    row.children[0].classList.add('social-media-list-item-img');
    row.children[1].classList.add('social-media-list-item-link');
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = e.currentTarget.textContent?.trim();
    });
  });
}
