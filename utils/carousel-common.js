export function whenElementReady(selector, callback, options = {}) {
  const {
    timeout = 5000,
    parent = document,
    stopAfterFound = true,
  } = options;

  const element = parent.querySelector(selector);
  if (element.offsetWidth) {
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
        if (foundElement.offsetWidth) {
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
    attributes: true,
    offsetWidth: true,
  });

  return { stop: cleanup };
}

export function getSlideWidth(block) {
  const singleItem = block.querySelector('li');
  const { gap } = window.getComputedStyle(singleItem.parentElement);
  return singleItem.offsetWidth + parseFloat(gap);
}

export function getChildSlideWidth(block) {
  return block.querySelector('li')?.offsetWidth;
}

export function updatePosition(block, currentIdx, type) {
  let targetIndex = currentIdx;
  // get element
  const ulElement = block.querySelector('ul');
  const trackBox = ulElement?.parentElement;
  const { gap } = window.getComputedStyle(ulElement);
  const items = block.querySelectorAll('li');
  // mobile type no transform ---use overflow scroll
  if (window.innerWidth < 860) {
    ulElement.style.transform = 'none';
    return;
  }
  // computer maxCLickCount and maxLength
  const prev = (targetIndex - 1) * getSlideWidth(block);
  const blockWidth = block.getBoundingClientRect().width;
  const maxLength = (items.length * getSlideWidth(block)) - parseInt(gap, 10);
  const maxClickCount = Math.ceil(items.length - 1 - (trackBox.offsetWidth - getChildSlideWidth(block)) / getSlideWidth(block));
  // after resize -- change the maxClickCount
  if (
    block.querySelector('.slide-next').disabled
    && type === 'resize'
  ) targetIndex = maxClickCount;
  if (window.innerWidth < 860) return;
  // computer the latest click move distance
  if (targetIndex >= maxClickCount) {
    const rightDistance = maxLength - blockWidth;
    ulElement.style.transform = `translateX(-${rightDistance}px)`;
  } else {
    ulElement.style.transform = `translateX(-${prev + getSlideWidth(block)}px)`;
  }
  // update arrow button disable status
  block.querySelector('.slide-prev').disabled = (targetIndex === 0);
  block.querySelector('.slide-next').disabled = (targetIndex >= maxClickCount);
  // update block dataset slideIndex
  block.dataset.slideIndex = targetIndex >= maxClickCount ? maxClickCount : targetIndex;
}

export function resizeObserver(selector, callback, options = {}) {
  const {
    parent = document,
  } = options;

  const ro = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      // entry.contentRect 包含了宽度、高度、坐标等信息
      requestAnimationFrame(() => {
        callback(entry.target);
      });
    });
  });
  const element = parent.querySelector(`#${selector}`);
  ro.observe(element);
}

export function throttle(fn, delay = 500) {
  let canRun = true;
  return (...args) => {
    if (!canRun) return;
    canRun = false;
    fn.apply(this, args);
    setTimeout(() => {
      canRun = true;
    }, delay);
  };
}

export function initCarouselVideo(carouselRoot, selector, resolveCallBack) {
  const vOptions = {
    root: carouselRoot,
    rootMargin: '0px',
    threshold: 1.0,
  };
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.intersectionRatio === 1) {
        resolveCallBack(video);
      }
    });
  }, vOptions);
  selector.forEach((v) => videoObserver.observe(v));
}

export function setupObserver(carouselRoot, selector, resolveCallBack, leaveCallBack) {
  const options = {
    threshold: 0.5,
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const v = entry.target;
      if (entry.isIntersecting) {
        initCarouselVideo(carouselRoot, selector, resolveCallBack);
      } else leaveCallBack(v);
    });
  }, options);
  if (carouselRoot) observer.observe(carouselRoot);
}

export function mobilePressEffect(viewport, card, callback) {
  if (viewport >= 860) {
    if (callback) callback();
    return;
  }
  let touchStartTime;
  let isScrolling = false;
  let startX;

  // 触摸开始
  card.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    startX = e.touches[0].clientX;
    isScrolling = false;
    card.classList.remove('touch-end');
    card.classList.add('touch-start');
  });

  // 触摸移动
  card.addEventListener('touchmove', (e) => {
    const currentX = e.touches[0].clientX;
    // 如果水平移动超过10px，认为是滑动
    if (Math.abs(currentX - startX) > 10) {
      isScrolling = true;
    }
  });

  // 触摸结束
  card.addEventListener('touchend', () => {
    card.classList.remove('touch-start');
    card.classList.add('touch-end');
    const touchDuration = Date.now() - touchStartTime;
    // 如果不是滑动，且按压时间小于500ms，执行跳转
    if (!isScrolling && touchDuration < 500) {
      callback();
    }
  });
}

export function cancelListener(block, selector) {
  block.querySelector(selector).removeEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
}
