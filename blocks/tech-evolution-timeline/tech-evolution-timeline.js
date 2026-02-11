export default async function decorate(block) {
  const timelineWrapper = document.createElement('div');
  timelineWrapper.className = 'timeline-wrapper';
  const techCardWrapper = document.createElement('div');
  techCardWrapper.className = 'tech-card-wrapper';
  const timeGreenLineEL = document.createElement('div');
  timeGreenLineEL.classList = 'time-green-line';

  // block add background color
  const timelineBlockEl = document.querySelector('.tech-evolution-timeline');
  const backgroundSelectArr = ['background-gradient'];
  const blockClassList = timelineBlockEl.className.split(' ');
  const existingItems = blockClassList.filter((item) => backgroundSelectArr.includes(item));
  if (existingItems.length > 0) {
    const timelineSectionEl = document.querySelector('.section.tech-evolution-timeline-container');
    timelineSectionEl.classList.add(`${existingItems}-container`);
  }

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
      circleImg.src = '/content/dam/hisense/us/common-icons/custom-icons/timeline-circle.svg';
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
  // block.append(timeGreenLineEL, timelineWrapper, techCardWrapper);
  block.append(timelineWrapper, techCardWrapper);
  if ([...timelineWrapper.children].length > 0) {
    // When the `timelinewrapper` element has a value, then add the `green line` element.
    timelineWrapper.parentNode.insertBefore(timeGreenLineEL, timelineWrapper);
  }
}
