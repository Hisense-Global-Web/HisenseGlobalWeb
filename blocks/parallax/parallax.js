/**
 * Loads a script element dynamically and resolves a promise when loaded.
 * @param {string} src The script URL
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export default async function decorate(block) {
  const image = block.querySelector('img');
  if (!image) return;

  const picture = block.querySelector('div:first-child');
  picture.classList.add('parallax-image-container');
  const text = block.querySelector('div:nth-child(2)');
  text.classList.add('text-overlay');

  const overlay = document.createElement('div');
  overlay.classList.add('gradient-overlay');
  document.body.appendChild(overlay);

  try {
    await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js');
    await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/ScrollTrigger.min.js');
  } catch (error) {
    console.error(error);
    return; // Stop execution if scripts fail to load
  }

  const { gsap } = window;
  const { ScrollTrigger } = window;

  gsap.registerPlugin(ScrollTrigger);

  const scrollDurationHeight = window.innerHeight * 3;
  block.style.height = `${scrollDurationHeight}px`; // Set the actual scroll height

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: block,
      start: 'top top',
      end: `+=${scrollDurationHeight}`, // End after the defined scroll distance
      scrub: 1,
      pin: true, // Pins the entire 'block' while the animation runs
      // markers: true
    },
  });

  tl.fromTo(
    image,
    { scale: 2 },
    {
      scale: 1,
      ease: 'power1.inOut',
    },
    1,
  );

  // tl.fromTo(
  //   overlay,
  //   { opacity: 0 },
  //   { opacity: 1, ease: 'none' },
  //   0,
  // );
  //
  // tl.to(
  //   overlay,
  //   { opacity: 0, ease: 'none' },
  //   0.5,
  // );

  tl.fromTo(
    text,
    {
      opacity: 0,
      yPercent: 200,
    },
    {
      opacity: 1,
      yPercent: -200,
      ease: 'none',
    },
    0,
  );

  tl.to(
    text,
    {
      opacity: 0,
      yPercent: -400,
      ease: 'none',
    },
    0.5,
  );
}
