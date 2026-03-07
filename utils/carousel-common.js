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

// 验证邮箱方法
export function validateEmail(email) {
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!email.trim()) {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

/**
 * UTC时区转换ISO时间为 Mmm D, YYYY 格式（如Nov 7, 2025）
 * @param {string} isoStr - 带Z的ISO时间字符串（如2026-02-14T00:00:00.000Z）
 * @returns {string} 格式化后的时间
 */
export function formatIsoToUtcStr(isoStr) {
  const date = new Date(isoStr);
  // 配置格式化规则：UTC时区、英文、月份缩写、数字日期、4位年份
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', // 关键：指定UTC时区，匹配原时间的Z
    month: 'short', // 月份缩写（Jan/Feb/.../Nov/Dec）
    day: 'numeric', // 数字日期（1-31）
    year: 'numeric', // 4位年份（2025/2026）
  });
  return formatter.format(date);
}

export function processPath(path) {
  if (path.startsWith('/content')) {
    const segments = path.split('/').filter(Boolean);
    const remainingSegments = segments.slice(2);
    return `/${remainingSegments.join('/')}`;
  }
  return path;
}
