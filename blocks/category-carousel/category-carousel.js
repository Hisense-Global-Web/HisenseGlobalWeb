import { moveInstrumentation } from '../../scripts/scripts.js';

const SCROLL_STEP = 260; // 单个标签宽度 + 间隙

function createScrollButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `scroll-btn scroll-${direction}`;
  button.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
  button.disabled = direction === 'left';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'left' ? '/content/dam/hisense/us/common-icons/icon-carousel/nav-left-g.svg' : '/content/dam/hisense/us/common-icons/icon-carousel/nav-right-g.svg';
  img.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'left' ? '/content/dam/hisense/us/common-icons/icon-carousel/nav-left.svg' : '/content/dam/hisense/us/common-icons/icon-carousel/nav-right.svg';
  imgClick.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
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
    const text = textCell.textContent.trim();
    if (text) {
      textSpan.textContent = text;
    }
    moveInstrumentation(textCell, textSpan);
  }

  // 获取link和tag数据
  const linkCell = cells[3];
  const tagCell = cells[4];

  const hasLink = linkCell && linkCell.querySelector('a');
  const tagValue = tagCell && tagCell.textContent ? tagCell.textContent.trim() : '';

  if (tagValue) {
    li.setAttribute('data-tag', tagValue);
    li.addEventListener('click', (e) => {
      e.stopPropagation();

      // 检查当前是否已选中
      const isCurrentlySelected = li.classList.contains('selected');

      if (isCurrentlySelected) {
        // 如果已选中，则取消选中并重置过滤器
        li.classList.remove('selected');

        const resetFiltersBtn = document.querySelector('.plp-reset-filters');
        if (resetFiltersBtn) {
          resetFiltersBtn.click();
        }
      } else {
        // 移除其他 product-filter-item 的选中状态?
        const allFilterItems = document.querySelectorAll('.product-filter-item');
        allFilterItems.forEach((item) => item.classList.remove('selected'));

        // 添加当前元素的选中状态?
        li.classList.add('selected');

        const resetFiltersBtn = document.querySelector('.plp-reset-filters');
        if (resetFiltersBtn) {
          resetFiltersBtn.click();
        }

        const filterItem = document.querySelector(`[data-option-value="${tagValue}"]`);
        if (filterItem) {
          filterItem.click();
        }
      }
    });
  } else if (hasLink) {
    // 如果只有链接没有标签，设置点击跳转?
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      e.currentTarget.classList.add('selected');
      window.location.href = hasLink.href;
    });
  }
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.forEach((paramValue, paramName) => {
    if (paramValue) {
      const targetValue = `${paramName}/${paramValue}`;
      if (tagValue.includes(targetValue)) {
        li.classList.add('selected');
      }
    }
  });

  li.append(imgBox, textSpan);
  return li;
}

function updateButtons(tabsList, leftBtn, rightBtn) {
  leftBtn.disabled = tabsList.scrollLeft <= 0;
  rightBtn.disabled = tabsList.scrollLeft + tabsList.clientWidth >= tabsList.scrollWidth;
}

function attachScrollHandlers(tabsList, leftBtn, rightBtn) {
  leftBtn.addEventListener('click', () => {
    tabsList.scrollBy({
      left: -SCROLL_STEP,
      behavior: 'smooth',
    });
    setTimeout(() => updateButtons(tabsList, leftBtn, rightBtn), 300);
  });

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
  // 给main 元素添加类名，为了给整个窗口添加灰色背景
  const main = document.querySelector('main');
  main.classList.add('main-plp-gray');
  // 编辑模式,如果 data-aue-resource 属性，说明现在浏览的是编辑模式
  const isEditMode = block.hasAttribute('data-aue-resource');

  const tabs = document.createElement('ul');
  tabs.className = 'product-filters';

  let itemElements = [...block.children];
  if (isEditMode) {
    const nodeList = block.querySelectorAll('[data-aue-model="category-carousel-item"], [data-aue-type="component"][data-aue-model]');
    itemElements = [...nodeList];
  }

  itemElements.forEach((item) => {
    const li = buildTab(item);
    const resource = item.getAttribute && item.getAttribute('data-aue-resource');
    if (resource) {
      // 保留 data-aue-resource
      li.setAttribute('data-aue-resource', resource);
    }
    tabs.append(li);
  });

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  tabsContainer.append(tabs);

  const leftBtn = createScrollButton('left');
  const rightBtn = createScrollButton('right');
  attachScrollHandlers(tabs, leftBtn, rightBtn);

  const scrollTabs = document.createElement('div');
  scrollTabs.className = 'scroll-tabs';
  scrollTabs.append(leftBtn, tabsContainer, rightBtn);
  if (tabs?.childElementCount > 4) {
    rightBtn.removeAttribute('disabled');
  }

  block.replaceChildren(scrollTabs);
}
