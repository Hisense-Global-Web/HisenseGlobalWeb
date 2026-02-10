export default async function decorate(block) {
  // console.log(block, 'bbb');
  [...block.children].forEach((row) => {
    // component type name
    const type = row.firstElementChild?.textContent?.trim() || '';
    row.className = type;
    row.firstElementChild.remove();
    // [...row.children].forEach((column, colIndex) => {
    //   const columnType = column.firstElementChild?.textContent?.trim() || '';
    //   column.className = columnType;
    //   column.firstElementChild.remove();
    // });
  });
}
