import { loadScript } from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';
import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';

export default async function decorate(block) {
  // 如果block 是main 元素第一个的话，需要动态设置header高度，为block添加padding-top
  getDynamicHeaderHeight(block);

  // 在author 编辑模式下，当multiselect 为空值时，不显示 None
  const isEditorMode = block.hasAttribute('data-aue-resource')
  || block.hasAttribute('data-aue-type')
  || block.closest('[data-aue-resource]')
  || block.closest('[data-aue-type]');

  if (isEditorMode) {
    const multiNoneEl = document.querySelector('.HpsDkq_spectrum-Tags-container--empty [aria-label="Description Alignment Class Name Options"]');
    if (multiNoneEl) {
      multiNoneEl.style.display = 'none';
    }
  }

  if (isUniversalEditor()) {
    return;
  }

  if (!window.gsap) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js');
    } catch (error) {
      return;
    }
  }

  if (!window.ScrollTrigger) {
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/ScrollTrigger.min.js');
    } catch (error) {
      return;
    }
  }

  const {
    gsap,
    ScrollTrigger,
  } = window;

  gsap.registerPlugin(ScrollTrigger);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: block,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: 1,
      // markers: true,
    },
  });

  tl.from(block, {
    yPercent: 50,
    duration: 1,
  });

  [...block.children].forEach((row, idx) => {
    if (idx !== 0) {
      row.className = 'text-gray-tips';
    }
  });
}
