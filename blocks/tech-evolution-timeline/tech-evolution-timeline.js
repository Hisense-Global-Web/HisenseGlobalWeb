export default async function decorate(block) {
  const timelineWrapper = document.createElement('div');
  timelineWrapper.className = 'timeline-wrapper';
  const techCardWrapper = document.createElement('div');
  techCardWrapper.className = 'tech-card-wrapper';
  const timeGreenLineEL = document.createElement('div');
  timeGreenLineEL.classList = 'time-green-line';
  [...block.children].forEach((row) => {
    // component type name
    const type = row.firstElementChild?.textContent?.trim() || '';
    row.className = type;
    row.firstElementChild.remove();

    const techCardInfoEl = document.createElement('div');
    techCardInfoEl.className = 'tech-card-info';
    [...row.children].forEach((column, colIndex) => {
      const columnType = column.firstElementChild?.textContent?.trim() || '';
      column.className = columnType;
      column.firstElementChild.remove();
      // tech card info
      if (type === 'component-tech-card') {
        if (colIndex > 0) {
          techCardInfoEl.append(column);
        }
      }
    });

    // type: component-timeline and component-tech-card
    if (type === 'component-timeline') {
      const timelineDotEl = document.createElement('div');
      timelineDotEl.className = 'timeline-dot';
      const circleImg = document.createElement('img');
      circleImg.src = '/content/dam/hisense/us/common-icons/timeline-circle.svg';
      circleImg.alt = 'Timeline dot';
      timelineDotEl.append(circleImg);
      row.prepend(timelineDotEl);
      timelineWrapper.append(row);
    } else {
      row.append(techCardInfoEl);
      techCardWrapper.append(row);
      techCardWrapper.append(row);
    }
  });
  block.append(timeGreenLineEL, timelineWrapper, techCardWrapper);
}
