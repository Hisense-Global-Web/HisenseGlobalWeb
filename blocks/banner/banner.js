export default function decorate(block) {
  [...block.children].forEach((row, idx) => {
    if (idx === 0) {
      row.className = 'pc-box-img';
    } else {
      row.className = 'mobile-box-img';
    }
  });
}
