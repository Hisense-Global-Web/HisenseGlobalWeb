import { createElement } from '../../utils/dom-helper.js';

export default async function decorate(block) {
  // ========== CONSTRUCT DOM [START] ========== //
  const staticContent = block.querySelector('div:first-of-type');

  const phaseTextContainer = createElement('div', 'timeline-phase-text-container h-grid-container');
  const phaseImageContainer = createElement('div', 'timeline-phase-image-container h-grid-container');
  [...block.children].forEach((child) => {
    if (child !== staticContent) {
      const elements = child.querySelectorAll('p');
      const textGroup = createElement('div', 'timeline-phase-text');
      elements.forEach((element) => {
        const picture = element.querySelector('picture');
        if (picture) {
          picture.classList.add('timeline-phase-picture');
          element.classList.add('timeline-phase-image');
          phaseImageContainer.appendChild(element);
        } else {
          textGroup.appendChild(element);
          phaseTextContainer.appendChild(textGroup);
        }
      });
    }
  });

  block.appendChild(phaseTextContainer);
  block.appendChild(phaseImageContainer);
  // ========== CONSTRUCT DOM [END] ========== //

  const textContainers = block.querySelectorAll('.timeline-phase-text');
  const imageContainers = block.querySelectorAll('.timeline-phase-image');
  textContainers.forEach((container, index) => {
    container.addEventListener('mouseenter', () => {
      imageContainers[index].classList.toggle('hovering');
    });
    container.addEventListener('mouseleave', () => {
      imageContainers[index].classList.toggle('hovering');
    });
  });

  imageContainers.forEach((container, index) => {
    container.addEventListener('mouseenter', () => {
      textContainers[index].classList.toggle('hovering');
    });
    container.addEventListener('mouseleave', () => {
      textContainers[index].classList.toggle('hovering');
    });
  });
}
