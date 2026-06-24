/**
 * 获取 div 中文本的实际渲染行数
 * @param {HTMLElement} el - 目标 div 元素
 * @returns {number} 行数
 */
const getTextLineCount = (el) => {
  if (!el || el.nodeType !== 1) return 0;

  const range = document.createRange();
  range.selectNodeContents(el);

  // 获取文本每一行的渲染矩形
  const rects = range.getClientRects();
  if (rects.length === 0) return 0;

  // 通过 top 值去重（兼容 inline 标签、亚像素渲染抖动）
  const lineTops = new Set();
  // eslint-disable-next-line no-restricted-syntax
  for (const rect of rects) {
    if (rect.height > 0.5) { // 过滤空行/零高矩形
      lineTops.add(Math.round(rect.top));
    }
  }
  return lineTops.size || 1;
};

export default function decorate(block) {
  const [dynamicSwitch, pcInfoEl, mobileImageEl, titleEl, bodyTextEl, buttonContainerEl] = [...block.children] ?? [];
  console.log(dynamicSwitch, 'dynamicSwitch');
  if (pcInfoEl) {
    pcInfoEl.className = 'pc-box-img';
  }
  if (mobileImageEl) {
    mobileImageEl.className = 'mobile-box-img';
  }
  const conentContainerEl = document.createElement('div');
  conentContainerEl.className = 'content-container';

  const bodyContainerEl = document.createElement('div');
  bodyContainerEl.className = 'body-container';
  if (titleEl) {
    titleEl.className = 'title';
    bodyContainerEl.appendChild(titleEl);
  }
  if (bodyTextEl) {
    bodyTextEl.className = 'body-text';
    bodyContainerEl.appendChild(bodyTextEl);
  }
  conentContainerEl.appendChild(bodyContainerEl);

  if (buttonContainerEl) {
    const ctaContainerEl = document.createElement('div');
    ctaContainerEl.className = 'cta-container';
    const [primaryBtnEl, secondaryBtnEl] = buttonContainerEl.children?.[0]?.children ?? [];
    if (primaryBtnEl) {
      if (primaryBtnEl?.classList.contains('button-container')) {
        ctaContainerEl.appendChild(primaryBtnEl);
      } else {
        primaryBtnEl?.remove();
      }
    }
    if (secondaryBtnEl) {
      if (secondaryBtnEl?.classList.contains('button-container')) {
        primaryBtnEl.classList.add('green-btn');
        ctaContainerEl.appendChild(secondaryBtnEl);
      } else {
        secondaryBtnEl?.remove();
      }
    }
    conentContainerEl.appendChild(ctaContainerEl);
  } else {
    buttonContainerEl?.remove?.();
  }

  block.appendChild(conentContainerEl);

  setTimeout(() => {
    const titleTextEl = block.querySelector('.title');
    const bodyTextPEl = block.querySelector('.body-text');
    const titleLineCount = getTextLineCount(titleTextEl);
    if (titleLineCount === 1) {
      bodyTextPEl?.classList?.add('body-text-line-clamp1');
    } else if (titleLineCount === 2) {
      bodyTextPEl?.classList?.add('body-text-line-clamp2');
    } else {
      bodyTextPEl?.classList?.add('body-text-line-clamp3');
    }
  }, 500);
}
