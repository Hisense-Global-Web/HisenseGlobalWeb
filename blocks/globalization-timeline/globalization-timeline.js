import { createElement } from '../../utils/dom-helper.js';

export default async function decorate(block) {
  // ========== CONSTRUCT DOM [START] ========== //
  const titleContainer = createElement('div', 'timeline-title-container h-grid-container');
  const phaseTextContainer = createElement('div', 'timeline-phase-text-container h-grid-container');
  const phaseImageContainer = createElement('div', 'timeline-phase-image-container h-grid-container');

  const staticContent = block.querySelector('div:first-of-type');
  const staticPicture = staticContent.querySelector('picture');
  if (staticPicture) {
    staticPicture.classList.add('timeline-phase-picture');
    const staticImage = createElement('p', 'timeline-phase-image timeline-phase-image-static');
    staticImage.appendChild(staticPicture);
    phaseImageContainer.appendChild(staticImage);
  }
  const staticTitle = staticContent.querySelector('div');
  [...staticTitle.childNodes].forEach((child) => {
    if (child.textContent.trim() !== '') {
      titleContainer.appendChild(child);
    }
  });

  [...block.children].forEach((child) => {
    if (child !== staticContent) {
      const elements = child.querySelectorAll('p');
      const textGroup = createElement('div', 'timeline-phase-text');
      const textGroupHeader = createElement('div', 'timeline-phase-text-header');
      const description = createElement('div', 'timeline-phase-description');
      elements.forEach((element, index) => {
        const picture = element.querySelector('picture');
        if (picture) {
          picture.classList.add('timeline-phase-picture');
          element.classList.add('timeline-phase-image');
          phaseImageContainer.appendChild(element);
        } else {
          // eslint-disable-next-line default-case
          switch (index) {
            case 0:
              element.classList.add('timeline-phase-text-year');
              textGroupHeader.appendChild(element);
              break;
            case 1: {
              const group = createElement('div', 'timeline-phase-text-group');
              const text = createElement('div', 'timeline-phase-text-group-text');
              text.appendChild(element);
              const icon = createElement('img', 'timeline-phase-text-group-icon');
              icon.src = '/content/dam/hisense/us/common-icons/chevron-down-black.svg';
              group.appendChild(text);
              group.appendChild(icon);
              textGroupHeader.appendChild(group);
            }
              break;
            case 2:
              description.appendChild(element);
              break;
          }
        }
      });
      textGroup.appendChild(textGroupHeader);
      textGroup.appendChild(description);
      phaseTextContainer.appendChild(textGroup);
    }
  });

  block.appendChild(titleContainer);
  block.appendChild(phaseTextContainer);
  block.appendChild(phaseImageContainer);
  // ========== CONSTRUCT DOM [END] ========== //

  const bindEvents = () => {
    const textContainers = block.querySelectorAll('.timeline-phase-text');
    const imageContainers = block.querySelectorAll('.timeline-phase-image');

    textContainers.forEach((container, index) => {
      container.addEventListener('click', () => {
        container.classList.toggle('expanded');
      });
      container.addEventListener('mouseenter', () => {
        imageContainers[index + 1].classList.toggle('hovering');
      });
      container.addEventListener('mouseleave', () => {
        imageContainers[index + 1].classList.toggle('hovering');
      });
    });

    imageContainers.forEach((container, index) => {
      if (index === 0) return;
      container.addEventListener('mouseenter', () => {
        textContainers[index - 1].classList.toggle('hovering');
      });
      container.addEventListener('mouseleave', () => {
        textContainers[index - 1].classList.toggle('hovering');
      });
    });
  };

  bindEvents();
}
