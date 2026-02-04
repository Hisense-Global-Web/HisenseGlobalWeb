import { loadScript } from '../scripts/aem.js';

export async function loadGSAP() {
  let gsapLoaded = Boolean(window.gsap);
  if (!gsapLoaded) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js');
      gsapLoaded = true;
    } catch (error) {
      gsapLoaded = false;
    }
  }
  return gsapLoaded;
}

export async function loadScrollTrigger() {
  const gsapLoaded = await loadGSAP();
  if (!gsapLoaded) {
    return false;
  }

  let scrollTriggerLoaded = Boolean(window.ScrollTrigger);
  if (!scrollTriggerLoaded) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/ScrollTrigger.min.js');
      scrollTriggerLoaded = true;
    } catch (error) {
      scrollTriggerLoaded = false;
    }
  }
  return scrollTriggerLoaded;
}
