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
          const isNumber = Number(char).toString() !== 'NaN';
          const numberValue = Number(char);
          const finalNumberEle = createElement('div', isNumber ? 'number-char final-number-char' : '');
          const extraNumberEle = createElement('div', 'number-char');
          finalNumberEle.textContent = char;
          if (isNumber && numberValue > 0) {
            wrapper.classList.add('animate');
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < numberValue; i++) {
              const div = createElement('div', 'number-char');
              div.textContent = i.toString();
              wrapper.appendChild(div);
            }
            extraNumberEle.textContent = (numberValue + 1).toString();
          }
          wrapper.appendChild(finalNumberEle);
          wrapper.appendChild(extraNumberEle);
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

  const { gsap } = window;

  const animate = () => {
    const statsItems = document.querySelectorAll('.animated-stats-item');
    const timeline = gsap.timeline();

    statsItems.forEach((item, itemIndex) => {
      const numberWrappers = item.querySelectorAll('.number-wrapper.animate');

      numberWrappers.forEach((wrapper, wrapperIndex) => {
        const chars = wrapper.querySelectorAll('.number-char');
        const finalCharIndex = Array.from(chars)
          .findIndex((char) => char.classList.contains('final-number-char'));

        if (finalCharIndex === -1) return;

        // Set initial position
        gsap.set(wrapper, { y: 0 });

        // Calculate the distance to move
        const charHeight = chars[0].getBoundingClientRect().height;
        const finalPosition = -finalCharIndex * charHeight;
        const bounceOvershoot = finalCharIndex < chars.length - 1 ? -(charHeight / 3) : 0;

        // Add animation to timeline
        timeline.to(wrapper, {
          y: finalPosition + bounceOvershoot,
          duration: 1.5,
          ease: 'ease.outBack',
        }, `${itemIndex * 0.5 + wrapperIndex * 0.2}`)
          .to(wrapper, {
            y: finalPosition,
            duration: 0.2,
            ease: 'ease.outBack',
          }, '>-0.2');
      });
    });

    return timeline;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 1 });

  if (statsList) {
    observer.observe(statsList);
  }

  const handleResize = debounce(() => {
    if (statsList) {
      animate();
    }
  }, 300);
  window.addEventListener('resize', handleResize);
  // ========== ANIMATION [END] ========== //
}
