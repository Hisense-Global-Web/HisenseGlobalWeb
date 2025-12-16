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

  gsap.timeline({
    scrollTrigger: {
      trigger: block,
      start: 'top top', // Start when the top of the section hits the top of the viewport
      end: 'bottom top', // End when the bottom of the section leaves the viewport
      scrub: 1, // Smoothly sync animation to scroll position
      pin: true,
      // markers: true,
    },
  })
    .fromTo(
      image,
      { scale: 2 },
      {
        scale: 1,
        ease: 'power1.inOut',
      },
    );
}
