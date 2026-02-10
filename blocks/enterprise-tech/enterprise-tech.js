export default async function decorate(block) {
  // console.log(block, 'bbb');
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    return;
  }
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
