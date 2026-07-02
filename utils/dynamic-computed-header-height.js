export default function getDynamicHeaderHeight(block) {
  // Check if block is the first .block element in main
  const main = document.querySelector('main');
  const firstBlock = main?.querySelector('.block');
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (!isEditMode && block !== firstBlock) {
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
  const maxTries = 200;
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

/**
 * 关闭语言选择弹窗时，重新计算header高度，设置--nav-height变量
 */
export function closeLanguageAsideResetHeaderHeight() {
  const header = document.getElementById('navigation');
  let marginTop = 0;
  // 当header 中 【language-aside】关闭时，只给有header的页面且也设置--nav-height属性的页面重新计算hader 的高度
  if (header && document.documentElement.style.getPropertyValue('--nav-height')) {
    marginTop += Math.round(header.getBoundingClientRect().height);
    const navSecond = header.querySelector('.nav-second');
    if (navSecond && getComputedStyle(navSecond).display !== 'none') {
      marginTop += Math.round(navSecond.getBoundingClientRect().height);
    }
    document.documentElement.style.setProperty('--nav-height', `${marginTop}px`);
  }
}
