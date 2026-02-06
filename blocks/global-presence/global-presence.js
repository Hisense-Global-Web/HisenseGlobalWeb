import { createElement, debounce } from '../../utils/dom-helper.js';
import { loadScrollTrigger } from '../../utils/animation-helper.js';
import { isUniversalEditorAsync } from '../../utils/ue-helper.js';
import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  // ========== CONSTRUCT DOM [START] ========== //
  const container = block.querySelector('div:first-child');
  const elements = container.querySelectorAll('p');

  const contentContainer = createElement('div', 'global-presence-content h-grid-container');

  elements.forEach((row) => {
    const picture = row.querySelector('picture');
    if (picture) {
      picture.classList.add('h-picture');
      const backgroundImage = createElement('div', 'global-presence-background');
      const gradientOverlay = createElement('div', 'global-presence-gradient-overlay');
      backgroundImage.appendChild(picture);
      block.appendChild(backgroundImage);
      block.appendChild(gradientOverlay);
      row.remove();
    } else {
      row.classList.add('h-text');
      contentContainer.appendChild(row);
    }
  });

  const textElements = contentContainer.querySelectorAll('.h-text');
  if (textElements.length > 0) {
    const title = createElement('h1');
    title.textContent = textElements[0]?.textContent;
    textElements[0].replaceWith(title);
    if (textElements[1]) {
      contentContainer.appendChild(textElements[1]);
    }
  }

  container.remove();

  const statsList = createElement('ul', 'global-presence-stats-list');
  [...block.children].forEach((row) => {
    if (row.classList.length !== 0) {
      return;
    }
    const item = row.querySelector('div');
    if (item.children.length === 2) {
      const statsItem = createElement('li', 'global-presence-stats-list-item');
      statsItem.innerHTML = item.innerHTML;
      const firstItem = statsItem.querySelector('p');
      const animatedItem = createElement('div', 'animated-stats-item');
      const itemContent = firstItem.textContent;
      itemContent.split('')
        .forEach((char) => {
          const wrapper = createElement('div', 'number-wrapper');
          const isNumber = Number(char)
            .toString() !== 'NaN';
          const numberValue = Number(char);
          const finalNumberEle = createElement('div', isNumber ? 'number-char final-number-char' : '');
          finalNumberEle.textContent = char;
          if (isNumber && numberValue >= 0) {
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < numberValue; i++) {
              const div = createElement('div', 'number-char');
              div.textContent = i.toString();
              wrapper.appendChild(div);
            }
          }
          wrapper.appendChild(finalNumberEle);
          animatedItem.appendChild(wrapper);
        });
      firstItem.replaceWith(animatedItem);
      statsList.appendChild(statsItem);
      item.remove();
    }
  });
  contentContainer.appendChild(statsList);

  const contentPicture = block.querySelector('picture:not(.h-picture)');
  contentPicture.classList.add('h-picture');
  const contentImage = createElement('div', 'global-presence-image');
  contentImage.appendChild(contentPicture);
  contentContainer.appendChild(contentImage);

  block.appendChild(contentContainer);
  // ========== CONSTRUCT DOM [END] ========== //

  const isEditing = await isUniversalEditorAsync();
  if (isEditing) {
    return;
  }

  // ========== ANIMATION [START] ========== //
  const scrollTriggerLoaded = await loadScrollTrigger();
  if (!scrollTriggerLoaded) {
    return;
  }

  if (!window.SplitText) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/SplitText.min.js');
    } catch (error) {
      return;
    }
  }

  const {
    gsap,
    ScrollTrigger,
    SplitText,
  } = window;

  ScrollTrigger.config({ autoRefreshEvents: 'DOMContentLoaded,load' });

  gsap.registerPlugin(ScrollTrigger);
  gsap.registerPlugin(SplitText);

  let scrollTriggerInstance = null;

  const cleanup = () => {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
  };

  const animate = () => {
    cleanup();

    const items = gsap.utils.toArray('.animated-stats-item');
    items.forEach((item) => {
      const targets = item.querySelector('.number-wrapper');
      targets.forEach((target) => {
        gsap.to(target, {
          yPercent: -100,
          duration: 0.2,
          yoyo: true,
        }, '+=0.1');
      });
    });
  };

  animate();
  // block.addEventListener('load', animate, { once: true });

  const handleResize = debounce(() => {
    animate();
    // Refresh ScrollTrigger after a brief delay to ensure DOM has updated
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, 500);
  window.addEventListener('resize', handleResize);
  // ========== ANIMATION [END] ========== //
}
