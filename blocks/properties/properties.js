export default async function decorate(block) {
  const items = block.children;
  const contentContainer = document.createElement('div');
  const headerEle = document.createElement('button');

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

  const header = block.querySelector('.accordion-header');
  const content = block.querySelector('.accordion-content');
  header.addEventListener('click', () => {
    if (content.classList.contains('d-none')) {
      content.classList.remove('d-none');
    } else {
      content.classList.add('d-none');
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
