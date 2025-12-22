export default async function decorate(block) {
  [...block.children].forEach((row) => {
    row.className = 'info-card-item';
  });
}
