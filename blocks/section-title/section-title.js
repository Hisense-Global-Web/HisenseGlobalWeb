export default function decorate(block) {
  [...block.children].forEach((row, idx) => {
    if (idx === 0) {
      row.className = 'feature-pc-img';
    } else {
      row.className = 'feature-mobile-img';
    }
  });
}
