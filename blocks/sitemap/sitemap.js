import { getLocaleFromPath } from '../../scripts/locale-utils.js';
import { SCREEN_POINT } from '../../utils/constants.js';
import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';

export default function decorate(block) {
  const { country } = getLocaleFromPath();
  // document.documentElement.style.setProperty('--nav-height', '100px');
  const ulEl = document.createElement('ul');
  const blockPNode = block.closest('.sitemap-wrapper');
  // 根据屏幕宽度动态设置初始状态，并监听窗口大小变化（只有在移动设备上有展开收起）
  function getDynamicScreenWidth() {
    function mobileExpandOrHide() {
      const screenWidth = window.innerWidth;
      if (screenWidth < SCREEN_POINT) {
        if (blockPNode) {
          blockPNode.classList.add('hide');
          blockPNode.parentNode.children[0].classList.remove('hide');
        }
      }
    }
    mobileExpandOrHide(); // 初始调用设置正确的状态
    window.addEventListener('resize', () => mobileExpandOrHide());
  }
  getDynamicScreenWidth();
  // if (blockPNode) {
  //   blockPNode.classList.add('hide');
  //   blockPNode.parentNode.children[0].classList.remove('hide');
  // }
  [...block.children].forEach((row, index) => {
    if (!index) {
      row.classList.add('sitemap-title');
      const img = document.createElement('img');
      img.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
      img.addEventListener('click', (e) => {
        const pNode = e.currentTarget.closest('.sitemap-wrapper');
        pNode.classList.toggle('hide');
      });
      row.append(img);
    } else {
      const liEl = document.createElement('li');
      liEl.classList.add('sitemap-item');
      const aEl = row.querySelector('a');
      if (aEl) {
        aEl.textContent = row.children[0].textContent.trim();
        liEl.append(aEl);
      } else {
        const a = document.createElement('a');
        a.textContent = row.children[0].textContent.trim();
        liEl.append(a);
      }
      row.style.display = 'none';
      ulEl.appendChild(liEl);
    }
  });
  block.appendChild(ulEl);
  getDynamicHeaderHeight(block);
}
