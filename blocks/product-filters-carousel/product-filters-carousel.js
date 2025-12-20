import { moveInstrumentation } from '../../scripts/scripts.js';

const SCROLL_STEP = 256; // 单个标签宽度 + 间隙

function createScrollButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `scroll-btn scroll-${direction}`;
  button.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
  button.disabled = direction === 'left';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'left' ? 'left.svg' : 'left.svg';
  img.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  if (direction === 'right') {
    img.style.transform = 'scaleX(-1)';
  }
  button.appendChild(img);
  return button;
}

function buildTab(itemElement) {
  const li = document.createElement('li');
  li.className = 'product-filter-item';
  moveInstrumentation(itemElement, li);

  const cells = [...itemElement.children];

  const imageCell = cells.find((cell) => cell.querySelector('picture')) || cells[0];

  const textCells = cells.filter((cell) => {
    const text = cell.textContent.trim();
    return text && !cell.querySelector('picture') && !cell.querySelector('a');
  });
  const textCell = textCells[1] || textCells[0] || cells[1] || cells[0];

  const imgBox = document.createElement('div');
  imgBox.className = 'product-filter-img-box';
  if (imageCell) {
    const picture = imageCell.querySelector('picture');
    if (picture) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'product-filter-img';
      moveInstrumentation(imageCell, imgWrapper);
      imgWrapper.appendChild(picture);
      imgBox.append(imgWrapper);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-filter-img placeholder';
      imgBox.append(placeholder);
    }
  }

  const textSpan = document.createElement('span');
  textSpan.className = 'product-filter-text';
  if (textCell) {
    const text = textCell.innerHTML.trim();
    if (text) {
      textSpan.innerHTML = text;
    }
    moveInstrumentation(textCell, textSpan);
  }

  li.append(imgBox, textSpan);
  return li;
}

function updateButtons(tabsList, leftBtn, rightBtn) {
  leftBtn.disabled = tabsList.scrollLeft <= 0;
  rightBtn.disabled = tabsList.scrollLeft + tabsList.clientWidth >= tabsList.scrollWidth;
}

function attachScrollHandlers(tabsList, leftBtn, rightBtn) {
  // 左箭头点击
  leftBtn.addEventListener('click', () => {
    tabsList.scrollBy({
      left: -SCROLL_STEP,
      behavior: 'smooth',
    });
    setTimeout(() => updateButtons(tabsList, leftBtn, rightBtn), 300);
  });

  // 右箭头点击
  rightBtn.addEventListener('click', () => {
    tabsList.scrollBy({
      left: SCROLL_STEP,
      behavior: 'smooth',
    });
    setTimeout(() => updateButtons(tabsList, leftBtn, rightBtn), 300);
  });

  tabsList.addEventListener('scroll', () => updateButtons(tabsList, leftBtn, rightBtn));
  window.addEventListener('resize', () => updateButtons(tabsList, leftBtn, rightBtn));

  updateButtons(tabsList, leftBtn, rightBtn);
}

export default function decorate(block) {
  // 编辑模式,如果有 data-aue-resource 属性，说明现在浏览的是编辑模式
  const isEditMode = block.hasAttribute('data-aue-resource');

  const tabs = document.createElement('ul');
  tabs.className = 'product-filters';

  let itemElements = [...block.children];
  if (isEditMode) {
    const nodeList = block.querySelectorAll('[data-aue-model="product-filters-carousel-item"], [data-aue-type="component"][data-aue-model]');
    itemElements = [...nodeList];
  }

  itemElements.forEach((item) => {
    const li = buildTab(item);
    const resource = item.getAttribute && item.getAttribute('data-aue-resource');
    if (resource) {
      // 保留 data-aue-resource，用于编辑
      li.setAttribute('data-aue-resource', resource);
    }
    tabs.append(li);
  });

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  tabsContainer.append(tabs);

  const leftBtn = createScrollButton('left');
  const rightBtn = createScrollButton('right');

  const scrollTabs = document.createElement('div');
  scrollTabs.className = 'scroll-tabs';
  scrollTabs.append(leftBtn, tabsContainer, rightBtn);

  block.replaceChildren(scrollTabs);
  attachScrollHandlers(tabs, leftBtn, rightBtn);
}
