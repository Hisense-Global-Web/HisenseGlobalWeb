export default function getDynamicHeaderHeight(block) {
  // Check if block is the first .block element in main
  const main = document.querySelector('main');
  const firstBlock = main?.querySelector('.block');
  if (block !== firstBlock) {
    return;
  }

  // Set margin-top for block based on header and nav-second height, with retry if header loads late
  function setMarginTop() {
    const header = document.getElementById('navigation');
    let marginTop = 0;
    if (header) {
      // Mobile: navigation height already includes nav-second
      if (window.innerWidth < 1180) {
        marginTop = Math.round(header.getBoundingClientRect().height);
        block.style.marginTop = `${marginTop}px`;
        document.documentElement.style.removeProperty('--nav-height');
      } else {
        marginTop += Math.round(header.getBoundingClientRect().height);
        const navSecond = header.querySelector('.nav-second');
        if (navSecond && getComputedStyle(navSecond).display !== 'none') {
          marginTop += Math.round(navSecond.getBoundingClientRect().height);
        }
        block.style.marginTop = 0;
        document.documentElement.style.setProperty('--nav-height', `${marginTop}px`);
      }
      return true;
    }
    return false;
  }

  // Try immediately, then retry if header not loaded
  let tries = 0;
  const maxTries = 20;
  function trySetMarginTop() {
    if (!setMarginTop() && tries < maxTries) {
      tries += 1;
      setTimeout(trySetMarginTop, 100);
    }
  }
  trySetMarginTop();

  // Recalculate on window resize
  window.addEventListener('resize', setMarginTop);
}
