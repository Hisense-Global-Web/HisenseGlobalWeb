import { createElement, debounce } from '../../utils/dom-helper.js';
import { loadScrollTrigger } from '../../utils/animation-helper.js';
import { isUniversalEditorAsync } from '../../utils/ue-helper.js';

export default async function decorate(block) {
  // ========== CONSTRUCT DOM [START] ========== //
  const staticContent = block.querySelector('div:first-of-type');

  const phaseTextContainer = createElement('div', 'timeline-phase-text-container');
  const phaseImageContainer = createElement('div', 'timeline-phase-image-container');
  [...block.children].forEach((child) => {
    if (child !== staticContent) {
      const elements = child.querySelectorAll('p');
      elements.forEach((element) => {
        const picture = element.querySelector('picture');
        if (picture) {
          phaseImageContainer.appendChild(element);
        } else {
          const textGroup = createElement('div', 'timeline-phase-text');
          textGroup.appendChild(element);
          phaseTextContainer.appendChild(textGroup);
        }
      });
    }
  });

  block.appendChild(phaseTextContainer);
  block.appendChild(phaseImageContainer);

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

  const {
    gsap,
    ScrollTrigger,
  } = window;

  ScrollTrigger.config({ autoRefreshEvents: 'DOMContentLoaded,load' });

  gsap.registerPlugin(ScrollTrigger);

  let scrollTriggerInstance = null;

  const cleanup = () => {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
  };

  const animate = () => {
    cleanup();
  };

  block.addEventListener('load', animate, { once: true });

  const handleResize = debounce(() => {
    // animate();
    // Refresh ScrollTrigger after a brief delay to ensure DOM has updated
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, 500);
  window.addEventListener('resize', handleResize);
  // ========== ANIMATION [END] ========== //
}
