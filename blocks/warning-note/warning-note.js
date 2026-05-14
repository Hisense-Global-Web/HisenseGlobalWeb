export default function decorate(block) {
  [...block.children].forEach((row, index) => {
    if (index === 0) {
      row.classList.add('note-title');
    } else if (index === 1) {
      row.classList.add('note-context');
    }
  });
}
