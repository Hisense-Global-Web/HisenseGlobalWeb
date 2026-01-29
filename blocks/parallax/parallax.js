import { createOptimizedPicture, loadScript } from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';
import { createElement, debounce } from '../../utils/dom-helper.js';

const ANIMATION_DURATION = {
  IMAGE_BRIGHTNESS: 0.3,
  IMAGE_SCALE: 2,
  TEXT_SCROLL: 3,
  TEXT_FADE_IN: 0.1,
  TEXT_FADE_IN_DELAY: 0.1,
  CONTAINER_HEIGHT: 0.3,
};

const CONFIG = {
  SMALL_VIEWPORT_MAX_WIDTH: 860,
  MEDIUM_VIEWPORT_MAX_WIDTH: 1180,
  MIN_VIEWPORT_HEIGHT: 600,
  MAX_VIEWPORT_WIDTH: 1920,
  SCALE_MULTIPLIER: 1.2,
  MIN_SCALE: 2,
  SCROLL_MULTIPLIER: 2,
};

export default async function decorate(block) {
  const scrollContainer = block.querySelector('div:first-child');
  scrollContainer.className = 'scroll-container';
  const subContainer = block.querySelector('div:nth-child(2)');

  let scaleTarget = scrollContainer.querySelector('img');
  if (!scaleTarget) return;

  const scrollTextContainer = scrollContainer.querySelector('div');
  scrollTextContainer.classList.add('scroll-text-container');

  const optimizedPicture = createOptimizedPicture(scaleTarget.src, scaleTarget.alt, false, [{
    media: '(min-width: 860px)',
    width: '3000',
  }, { width: '1920' }]);
  scaleTarget = optimizedPicture.querySelector('img');
  scrollTextContainer.children[0].remove();

  const stickyContainer = createElement('div', 'sticky-container');
  scrollContainer.appendChild(stickyContainer);
  const scrollImageContainer = createElement('div', 'scroll-image-container h-grid-container');
  scrollImageContainer.appendChild(optimizedPicture);
  stickyContainer.appendChild(scrollImageContainer);
  stickyContainer.appendChild(scrollTextContainer);

  if (subContainer) {
    subContainer.className = 'sub-container h-grid-container';
    const subTextContainer = subContainer.querySelector('div');
    subTextContainer.classList.add('sub-text-container');
    const subImage = subTextContainer.children[0];

    if (subImage) {
      const subImageContainer = createElement('div', 'sub-image-container');
      subImageContainer.appendChild(subImage);
      subContainer.appendChild(subImageContainer);
      subContainer.appendChild(subTextContainer);
    }
  }

  if (isUniversalEditor()) {
    return;
  }

  // Add animated-text class to all children of scroll text container
  Array.from(scrollTextContainer.children).forEach((element) => {
    element.classList.add('animated-text');
  });

  // Load the GSAP library if not already loaded
  if (!window.gsap) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js');
    } catch (error) {
      return;
    }
  }

  // Load ScrollTrigger plugin if not already loaded
  if (!window.ScrollTrigger) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/ScrollTrigger.min.js');
    } catch (error) {
      return;
    }
  }

  const {
    gsap,
    ScrollTrigger,
  } = window;

  ScrollTrigger.config({ autoRefreshEvents: 'DOMContentLoaded,load' });

  gsap.registerPlugin(ScrollTrigger);

  // Store references for cleanup
  let matchMediaContext = null;
  let scrollTriggerInstance = null;

  // Clean up existing animations
  const cleanup = () => {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
    if (matchMediaContext) {
      matchMediaContext.revert();
      matchMediaContext = null;
    }
  };

  const resizeHandler = () => {
    if (!scaleTarget.complete) {
      return;
    }
    const shouldAnimate = window.innerHeight >= CONFIG.MIN_VIEWPORT_HEIGHT;
    scrollTextContainer.classList.toggle('animate', shouldAnimate);

    const scrollImageContainerHeight = scrollImageContainer.getBoundingClientRect().height;
    const stickyContainerHeight = stickyContainer.getBoundingClientRect().height;

    subContainer.style.marginTop = `-${(stickyContainerHeight - scrollImageContainerHeight) / 2}px`;
  };

  const animate = () => {
    if (!scaleTarget.complete) {
      return;
    }

    // Clean up existing animations before creating new ones
    cleanup();

    resizeHandler();

    const matchMedia = gsap.matchMedia();
    matchMediaContext = matchMedia;

    matchMedia.add({
      aboveMinHeight: `(min-height: ${CONFIG.MIN_VIEWPORT_HEIGHT}px)`,
      smallViewport: `(max-width: ${CONFIG.SMALL_VIEWPORT_MAX_WIDTH}px)`,
      belowMaxWidth: `(max-width: ${CONFIG.MAX_VIEWPORT_WIDTH}px)`,
    }, (context) => {
      const {
        smallViewport, aboveMinHeight, belowMaxWidth,
      } = context.conditions;
      if ((!smallViewport && !aboveMinHeight) || !belowMaxWidth) {
        return;
      }

      scrollTextContainer.classList.add('animate');
      scrollContainer.classList.add('animate');

      // Calculate image dimensions and viewport
      const initialImageWidth = scaleTarget.clientWidth;
      const initialImageHeight = scaleTarget.clientHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate scale to fill viewport with margin
      const scaleX = viewportWidth / initialImageWidth;
      const scaleY = viewportHeight / initialImageHeight;
      const fillScale = Math.max(scaleX, scaleY) * CONFIG.SCALE_MULTIPLIER;
      const scale = Math.max(CONFIG.MIN_SCALE, fillScale);

      const scrollImageContainerHeight = scrollImageContainer.getBoundingClientRect().height;
      const stickyContainerHeight = stickyContainer.getBoundingClientRect().height;
      const subContainerOffset = -((stickyContainerHeight - scrollImageContainerHeight) / 2);
      subContainer.style.marginTop = `${subContainerOffset}px`;

      // Calculate scroll trigger start position (when image center aligns with viewport center)
      const calculateScrollStart = () => {
        const imageRect = scaleTarget.getBoundingClientRect();
        const { scrollY } = window;
        const imageTopAbsolute = imageRect.top + scrollY;
        const imageCenterAbsolute = imageTopAbsolute + (imageRect.height / 2);
        const triggerRect = scrollContainer.getBoundingClientRect();
        const triggerTopAbsolute = triggerRect.top + scrollY;

        const offsetFromTriggerTop = imageCenterAbsolute - triggerTopAbsolute;
        return `top+=${offsetFromTriggerTop} center`;
      };

      // Calculate scroll trigger end position
      const calculateScrollEnd = () => {
        const additionalScroll = (viewportHeight * CONFIG.SCROLL_MULTIPLIER) + scaleTarget.clientHeight;
        return `+=${additionalScroll}`;
      };

      // Set up GSAP timeline with ScrollTrigger
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollContainer,
          start: calculateScrollStart,
          end: calculateScrollEnd,
          scrub: 1,
          pin: true,
          // markers: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Store ScrollTrigger instance for cleanup
      scrollTriggerInstance = tl.scrollTrigger;

      // Scale the image up to fill viewport
      tl.set(scaleTarget, {
        scale,
        transformOrigin: 'center center',
      });

      tl.set(subContainer, {
        transform: 'translateY(50%)',
      });

      // Animation step 1: Dim the image brightness
      tl.fromTo(
        scaleTarget,
        { filter: 'brightness(1)' },
        {
          filter: 'brightness(0.3)',
          duration: ANIMATION_DURATION.IMAGE_BRIGHTNESS,
        },
        0,
      );

      // Animation step 2: Scroll the text upwards
      tl.fromTo(
        scrollTextContainer,
        {
          yPercent: 100,
        },
        {
          yPercent: -100,
          ease: 'none',
          duration: ANIMATION_DURATION.TEXT_SCROLL,
        },
        '>',
      );

      // Animation step 3: Fade in each line of text while scrolling
      const textLines = gsap.utils.toArray('.scroll-text-container .animated-text');
      textLines.forEach((line) => {
        tl.fromTo(
          line,
          { opacity: 0 },
          {
            opacity: 1,
            ease: 'none',
            duration: ANIMATION_DURATION.TEXT_FADE_IN,
            delay: ANIMATION_DURATION.TEXT_FADE_IN_DELAY,
          },
          '<',
        );
      });

      // Animation step 4: Restore image brightness
      tl.to(
        scaleTarget,
        {
          filter: 'brightness(1)',
          duration: ANIMATION_DURATION.IMAGE_BRIGHTNESS,
        },
        '-=1',
      );

      // Animation step 5: Scale image back to original size
      tl.to(
        scaleTarget,
        {
          scale: 1,
          ease: 'power1.inOut',
          duration: ANIMATION_DURATION.IMAGE_SCALE,
        },
        '>',
      );

      tl.to(
        subContainer,
        {
          transform: 'translateY(0px)',
          ease: 'power1.inOut',
        },
      );
    });
  };

  // Initial setup
  resizeHandler();

  // Handle viewport resize - recalculate and recreate animation
  const handleResize = debounce(() => {
    animate();
    // Refresh ScrollTrigger after a brief delay to ensure DOM has updated
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, 500);

  // Handle content height changes (e.g., other content above/below changes)
  const handleContentChange = debounce(() => {
    if (scrollTriggerInstance) {
      ScrollTrigger.refresh();
    }
  }, 300);

  // Observe viewport resize
  window.addEventListener('resize', handleResize);

  // Observe content changes that might affect layout
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver((entries) => {
      // Check if image size changed - if so, recreate animation
      const imageEntry = entries.find((entry) => entry.target === scaleTarget);
      if (imageEntry) {
        handleResize();
      } else {
        // Other content changed - just refresh
        handleContentChange();
      }
    });

    // Observe the block, containers, and image for size changes
    resizeObserver.observe(block);
    resizeObserver.observe(scrollContainer);
    resizeObserver.observe(scaleTarget);
    if (subContainer) {
      resizeObserver.observe(subContainer);
    }
  }

  // Initialize animation when image loads
  if (scaleTarget.complete) {
    animate();
  } else {
    scaleTarget.addEventListener('load', animate, { once: true });
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
}
