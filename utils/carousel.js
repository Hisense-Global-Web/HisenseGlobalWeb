export function whenElementReady(selector, callback, options = {}) {
  const {
    timeout = 5000,
    parent = document,
    stopAfterFound = true,
  } = options;

  const element = parent.querySelector(selector);
  if (element) {
    setTimeout(() => callback(element), 0);
    return { stop: () => {} };
  }

  let observer;
  let timeoutId;

  const cleanup = () => {
    if (observer) observer.disconnect();
    if (timeoutId) clearTimeout(timeoutId);
  };

  // Setup timeout
  if (timeout > 0) {
    timeoutId = setTimeout(() => {
      cleanup();
    }, timeout);
  }

  // Setup MutationObserver
  observer = new MutationObserver((mutations) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'subtree') {
        const foundElement = parent.querySelector(selector);
        if (foundElement) {
          cleanup();
          callback(foundElement);
          if (stopAfterFound) break;
        }
      }
    }
  });

  // Start observing
  observer.observe(parent, {
    childList: true,
    subtree: true,
  });

  return { stop: cleanup };
}

export function getSlideWidth(block) {
  const singleItem = block.querySelector('li');
  const { gap } = window.getComputedStyle(singleItem.parentElement);
  return singleItem.offsetWidth + parseFloat(gap);
}

export function updatePosition(block, currentIdx, baseBody) {
  const trackBox = block.querySelector('ul');
  const items = block.querySelectorAll('li');
  const prev = (currentIdx - 1) * getSlideWidth(block);
  const baseContainerWidth = baseBody
    ? document.body.getBoundingClientRect().width : trackBox.offsetWidth;
  const maxlength = Math.round((items.length * getSlideWidth(block)) / baseContainerWidth);
  const { gap } = window.getComputedStyle(trackBox);
  if (currentIdx === maxlength) {
    const lastDistance = baseContainerWidth
      - items[items.length - 1].getBoundingClientRect().right;
    trackBox.style.transform = `translateX(-${prev + Math.abs(lastDistance) + parseFloat(gap)}px)`;
  } else {
    trackBox.style.transform = `translateX(-${prev + getSlideWidth(block)}px)`;
  }
  trackBox.style.transition = 'all 0.5';
  block.querySelector('.slide-prev').disabled = (currentIdx === 0);
  block.querySelector('.slide-next').disabled = (currentIdx >= maxlength);
}
