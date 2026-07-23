export default function decorate(block) {
  console.log('block', block);
  [...block.children].forEach((item) => {
    item.classList = 'info-card-item';
    const columns = [...item.children];
    columns.forEach((col) => {
      if (col.querySelector('img')) {
        col.classList = 'card-image';
      } else {
        col.classList = 'card-description';
        const [title, text] = [...col.children];
        title.classList = 'card-tit';
        text.classList = 'card-text';
      }
    });
  });
}
