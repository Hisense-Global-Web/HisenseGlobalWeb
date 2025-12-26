import { loadScript } from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';
import { debounce } from '../../utils/dom-helper.js';

const ANIMATION_DURATION = {
  IMAGE_BRIGHTNESS: 0.3,
  IMAGE_SCALE: 2,
  TEXT_SCROLL: 3,
  TEXT_FADE_IN: 0.1,
  TEXT_FADE_IN_DELAY: 0.1,
};

export default async function decorate(block) {
  const img = block.querySelector('img');
  if (!img) return;

  const imageContainer = block.querySelector('div:first-child');
  imageContainer.classList.add('scroll-image-container');

  // const textContainer = block.querySelector('div:nth-child(2)');
  // textContainer.classList.add('scroll-text-container');

  if (isUniversalEditor()) {
    return;
  }

  // const textElements = block.querySelector('.scroll-text-container > div');
  // if (textElements.children.length > 0) {
  //   Array.from(textElements.children)
  //     .forEach((element) => {
  //       element.classList.add('animated-text');
  //     });
  // }

  if (!window.gsap) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js');
    } catch (error) {
      return;
    }
  }

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

  gsap.registerPlugin(ScrollTrigger);

  const resizeHandler = () => {
    if (!img.complete) {
      return;
    }
    if (window.innerWidth >= 900 && window.innerHeight >= 700) {
      imageContainer.classList.add('animate');
      // textContainer.classList.add('animate');
    } else {
      imageContainer.classList.remove('animate');
      // textContainer.classList.remove('animate');
    }
    ScrollTrigger.refresh();
  };

  resizeHandler();
  const debounceResize = debounce(resizeHandler, 500);

  window.addEventListener('resize', debounceResize);

  img.addEventListener('load', () => {
    resizeHandler();

    const matchMedia = gsap.matchMedia();

    matchMedia.add({
      aboveMinWidth: '(min-width: 900px)',
      aboveMinHeight: '(min-height: 700px)',
    }, (context) => {
      const {
        aboveMinWidth,
        aboveMinHeight,
      } = context.conditions;
      // textContainer.classList.add('animate');
      if (aboveMinWidth && aboveMinHeight) {
        imageContainer.classList.add('animate');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: block,
            start: 'top top',
            end: '+=200%',
            scrub: 1,
            pin: true,
            // markers: true,
          },
        });

        // tl.fromTo(
        //   img,
        //   { filter: 'brightness(1)' },
        //   {
        //     filter: 'brightness(0.3)',
        //     duration: ANIMATION_DURATION.IMAGE_BRIGHTNESS,
        //   },
        //   0,
        // );

        // tl.fromTo(
        //   '.scroll-text-container > div',
        //   {
        //     yPercent: 100,
        //   },
        //   {
        //     yPercent: -100,
        //     ease: 'none',
        //     duration: ANIMATION_DURATION.TEXT_SCROLL,
        //   },
        //   '>',
        // );

        // const lines = gsap.utils.toArray('.scroll-text-container .animated-text');
        // lines.forEach((line) => {
        //   tl.fromTo(
        //     line,
        //     {
        //       opacity: 0,
        //     },
        //     {
        //       opacity: 1,
        //       ease: 'none',
        //       duration: 0.1,
        //       delay: 0.1,
        //     },
        //     '<',
        //   );
        // });

        // tl.to(
        //   img,
        //   {
        //     filter: 'brightness(1)',
        //     duration: ANIMATION_DURATION.IMAGE_BRIGHTNESS,
        //   },
        //   '-=1',
        // );

        tl.fromTo(
          img,
          { scale: 2 },
          {
            scale: 1,
            ease: 'power1.inOut',
            duration: ANIMATION_DURATION.IMAGE_SCALE,
          },
          0,
        );
      }
    });
  });
}
