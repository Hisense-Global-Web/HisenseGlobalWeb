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
  const ulElement = block.querySelector('ul');
  const trackBox = ulElement?.parentElement;
  const items = block.querySelectorAll('li');
  const prev = (currentIdx - 1) * getSlideWidth(block);
  const rightPadding = block.getBoundingClientRect().x;
  const baseContainerWidth = baseBody
    ? document.body.getBoundingClientRect().width : trackBox.offsetWidth;
  const distance = (items.length * getSlideWidth(block) + (2 * rightPadding)) / (trackBox.offsetWidth);
  const maxlength = Math.round(distance);
  const rightDistance = baseBody
    ? items[items.length - 1].getBoundingClientRect().right + rightPadding
    : items[items.length - 1].offsetLeft + (items.length + 1) * rightPadding;
  if (currentIdx === maxlength) {
    const lastDistance = baseContainerWidth
      - rightDistance;
    trackBox.style.transform = `translateX(-${prev + Math.abs(lastDistance)}px)`;
  } else {
    trackBox.style.transform = `translateX(-${prev + getSlideWidth(block)}px)`;
  }
  trackBox.style.transition = 'all 0.5';
  block.querySelector('.slide-prev').disabled = (currentIdx === 0);
  block.querySelector('.slide-next').disabled = (currentIdx >= maxlength);
}

export function resizeObserver(selector, callback, options = {}) {
  const {
    parent = document,
  } = options;

  const ro = new ResizeObserver((entries) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const entry of entries) {
      // entry.contentRect 包含了宽度、高度、坐标等信息
      const { width } = entry.contentRect;
      // entry.target.style.width = `${width}px`;
      if (width) {
        callback();
      }
    }
  });
  const element = parent.querySelector(selector);
  ro.observe(element);
}
