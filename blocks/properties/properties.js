export default async function decorate(block) {
  const items = block.children;
  const contentContainer = document.createElement('div');
  const headerEle = document.createElement('button');
  let expandedByDefault = false;

  Array.from(items)
    .forEach((item, index) => {
      if (index === 0) {
        const title = item.querySelector('div p').textContent;

        headerEle.classList.add('accordion-header');
        const titleEle = document.createElement('h3');
        titleEle.textContent = title;
        titleEle.classList.add('accordion-title');
        headerEle.appendChild(titleEle);

        const iconEle = document.createElement('span');
        const iconImageEle = document.createElement('img');
        iconImageEle.src = '/icons/chevron-up.svg';
        iconImageEle.setAttribute('aria-hidden', 'true');
        iconEle.classList.add('accordion-icon');
        iconEle.appendChild(iconImageEle);
        headerEle.appendChild(iconEle);
      } else if (index === 1) {
        expandedByDefault = item.textContent.trim()
          .toLowerCase() === 'true';
      } else {
        item.classList.add('property-item');
        item.querySelector('div:first-of-type')
          .classList
          .add('property-item-name');
        contentContainer.appendChild(item);
      }
    });

  block.innerHTML = '';
  block.appendChild(headerEle);

  contentContainer.classList.add('accordion-content');
  block.appendChild(contentContainer);

  if (expandedByDefault) {
    block.classList.add('expanded');
  }

  const header = block.querySelector('.accordion-header');
  header.addEventListener('click', () => {
    if (block.classList.contains('expanded')) {
      block.classList.remove('expanded');
    } else {
      block.classList.add('expanded');
    }
  });

  const allPropertiesBlocks = document.querySelectorAll('.block.properties');
  allPropertiesBlocks
    .forEach((target, index) => {
      if (index === 0) {
        target.classList.add('first');
      }
      if (index === allPropertiesBlocks.length - 1) {
        target.classList.add('last');
      }
    });
}
