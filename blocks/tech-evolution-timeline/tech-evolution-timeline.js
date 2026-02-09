export default async function decorate(block) {
  console.log(block, 'bbbb');
  const timelineWrapper = document.createElement('div');
  timelineWrapper.className = 'timeline-wrapper';
  const techCardWrapper = document.createElement('div');
  techCardWrapper.className = 'tech-card-wrapper';
  [...block.children].forEach(row => {
    // component type name
    const type = row.firstElementChild?.textContent?.trim() || '';
    row.className = type;
    row.firstElementChild.remove();
    [...row.children].forEach((column) => {
      console.log(column, 'cccc')
      const columnType = column.firstElementChild?.textContent?.trim() || '';
      column.className = columnType;
      // column.firstElementChild.remove();
    })
  });
}