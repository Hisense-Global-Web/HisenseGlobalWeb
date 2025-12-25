import { loadScript } from '../../scripts/aem.js';
import { createElement } from '../../utils/dom-helper.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';

const createResizeObserver = (callback, delay = 100) => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(callback, delay);
  };
};

function initializeDraggableSlider(wrapper, dragger, imageWrapperAfter) {
  const { gsap, Draggable } = window;

  // Register plugin only once
  if (!gsap.plugins.Draggable) {
    gsap.registerPlugin(Draggable);
  }

  // Cache DOM measurements for better performance
  let wrapperWidth = wrapper.offsetWidth;

  // Update dragger position based on drag
  const updateSliderPosition = (x) => {
    const clampedX = Math.max(0, Math.min(x, wrapper.offsetWidth));
    imageWrapperAfter.style.clipPath = `inset(0 0 0 ${clampedX}px)`;
  };

  // Create draggable instance with optimized settings
  Draggable.create(dragger, {
    type: 'x',
    bounds: wrapper,
    inertia: false, // Disable inertia for better performance
    dragClickables: false,
    minimumMovement: 1,
    onDrag() {
      const x = wrapper.offsetWidth / 2 + gsap.getProperty(this.target, 'x');
      updateSliderPosition(x);
    },
    onDragEnd() {
      // Clean up if needed
    },
  });

  // Handle window resize with debouncing
  const handleResize = createResizeObserver(() => {
    wrapperWidth = wrapper.offsetWidth;
    // Reset slider to center on resize
    gsap.set(dragger, { x: 0 });
    updateSliderPosition(wrapperWidth / 2);
  }, 250);

  window.addEventListener('resize', handleResize);
}

export default async function decorate(block) {
  // Early return if block doesn't have exactly 2 pictures
  const pictures = block.querySelectorAll('picture');
  if (pictures.length !== 2) {
    return;
  }

  // Destructure for clarity
  const [beforePicture, afterPicture] = pictures;

  // Build DOM structure using document fragments for better performance
  // const container = createElement('div', 'before-after-outer');
  const wrapper = createElement('div', 'before-after-wrapper');

  // Create dragger element with inner components
  const dragger = createElement('div', 'dragger');
  const draggerLineTop = createElement('div', 'dragger-line dragger-line-top');
  const draggerLineBottom = createElement('div', 'dragger-line dragger-line-bottom');

  const draggerInner = createElement('div', 'dragger-inner');
  const draggerIconLeft = createElement('div', 'dragger-icon-left');
  draggerIconLeft.textContent = '<';
  const draggerIconRight = createElement('div', 'dragger-icon-right');
  draggerIconRight.textContent = '>';

  draggerInner.append(draggerIconLeft, draggerIconRight);
  dragger.append(draggerLineTop, draggerLineBottom, draggerInner);

  // Create image wrappers
  const imageWrapperBefore = createElement('div', 'image-wrapper is-before');
  const imageWrapperAfter = createElement('div', 'image-wrapper is-after');

  imageWrapperBefore.append(beforePicture);
  imageWrapperAfter.append(afterPicture);

  // Assemble the structure
  wrapper.append(dragger, imageWrapperBefore, imageWrapperAfter);

  block.replaceChildren(wrapper);

  if (isUniversalEditor()) return;

  const scriptsToLoad = [
    {
      url: 'https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js',
      global: 'gsap',
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/Draggable.min.js',
      global: 'Draggable',
    },
  ];

  try {
    // eslint-disable-next-line no-restricted-syntax
    for (const { url, global } of scriptsToLoad) {
      if (!window[global]) {
        // eslint-disable-next-line no-await-in-loop
        await loadScript(url);
      }
    }
  } catch (error) {
    return;
  }

  initializeDraggableSlider(wrapper, dragger, imageWrapperAfter);
}
