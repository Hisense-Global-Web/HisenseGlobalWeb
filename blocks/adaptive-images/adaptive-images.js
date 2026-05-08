export default function decorate(block) {
  [...block.children].forEach((row, index) => {
    if (index === 0) {
      row.classList.add('pc-image');
    } else if (index === 1) {
      row.classList.add('mobile-image');
    }
  });
}
