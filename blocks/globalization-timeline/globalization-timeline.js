import { createElement } from '../../utils/dom-helper.js';
import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';
import popupShowUtils from '../../utils/popup-module-utils.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';
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
      if (child.querySelector('a')) {
        const picEl = createDynamicMediaPicture(child.querySelector('a').href);
        titleContainer.appendChild(picEl);
      } else {
        titleContainer.appendChild(child);
      }
    }
  });

  [...block.children].forEach((child) => {
    if (child !== staticContent) {
      const elements = child.querySelectorAll('p');
      const textGroup = createElement('div', 'timeline-phase-text');
      const textGroupHeader = createElement('div', 'timeline-phase-text-header');
      const description = createElement('div', 'timeline-phase-description');
      const learnMore = createElement('div', 'timeline-phase-learn-more');
      let sectionPopupId = '';
      elements.forEach((element, index) => {
        const picture = element.querySelector('picture');
        const aEl = element.querySelector('a');
        if (picture) {
          picture.classList.add('timeline-phase-picture');
          element.classList.add('timeline-phase-image');
          phaseImageContainer.appendChild(element);
        } else if (aEl) {
          const picEl = createDynamicMediaPicture(aEl.href);
          picEl.classList.add('timeline-phase-picture');
          element.classList.add('timeline-phase-image');
          element.children[0].style.display = 'none';
          element.appendChild(picEl);
          phaseImageContainer.appendChild(element);
        } else if (element.textContent.trim() !== 'true' && element.textContent.trim() !== 'false') {
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
              icon.src = `/content/dam/hisense/${country}/common-icons/chevron-down-black.svg`;
              icon.addEventListener('error', function () {
                this.src = this.src.replace(/(\/content\/dam\/hisense\/)[^/]+(\/)/, '$1global$2');
              });
              group.appendChild(text);
              group.appendChild(icon);
              textGroupHeader.appendChild(group);
            }
              break;
            case 2:
              description.appendChild(element);
              break;
            case 4:
              learnMore.textContent = element.textContent.trim();
              break;
            case 5:
              sectionPopupId = element.textContent.trim();
              break;
          }
        }
      });
      const isEmpty = (element) => element.childNodes.length === 0 && !element.textContent.trim();
      if (!isEmpty(textGroupHeader)) {
        textGroup.appendChild(textGroupHeader);
        textGroup.appendChild(description);
        textGroup.appendChild(learnMore);
        phaseTextContainer.appendChild(textGroup);
        if (!sectionPopupId) {
          // 如果没设置 sectionPopupId，则不展示 learnMore 按钮
          learnMore.style.display = 'none';
        }
        learnMore.setAttribute('data-id', sectionPopupId);
        textGroup.querySelector('.timeline-phase-learn-more').addEventListener('click', popupShowUtils);
      }
    }
    child.style.display = 'none';
  });

  block.appendChild(titleContainer);
  block.appendChild(phaseTextContainer);
  block.appendChild(phaseImageContainer);
  // ========== CONSTRUCT DOM [END] ========== //

  const bindEvents = () => {
    const textContainers = block.querySelectorAll('.timeline-phase-text');
    const imageContainers = block.querySelectorAll('.timeline-phase-image:not(.timeline-phase-image-static)');

    textContainers.forEach((container, index) => {
      container.addEventListener('click', () => {
        container.classList.toggle('expanded');
      });
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
  };

  bindEvents();
}
