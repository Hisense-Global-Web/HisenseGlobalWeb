import { isMobileWindow } from './device.js';

// eslint-disable-next-line import/prefer-default-export
export function storeInformationSelect() {
  const el = document.querySelectorAll('.store-information-card-container');
  const selectDiv = document.querySelectorAll('.store-locator')[0];
  selectDiv.classList.add('selectContainer');
  const [label1, placeholder1, label2, placeholder2, buttonDiv] = [...selectDiv.children];
  const selectTagTitle = document.createElement('div');
  selectTagTitle.className = 'selectTagTitle';
  selectTagTitle.innerHTML = label1?.firstElementChild.textContent?.trim();

  const customSelect1 = document.createElement('div');
  customSelect1.className = 'custom-select';
  const selectSelected1 = document.createElement('div');
  selectSelected1.className = 'select-selected';
  selectSelected1.textContent = 'Please select';
  selectSelected1.dataset.value = '';
  const arrow1 = document.createElement('img');
  arrow1.className = 'select-arrow';
  arrow1.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
  selectSelected1.appendChild(arrow1);

  const selectItems1 = document.createElement('div');
  selectItems1.className = 'select-items';
  customSelect1.append(selectSelected1, selectItems1);

  // 第二个下拉框
  const selectItemTagTitle = document.createElement('div');
  selectItemTagTitle.className = 'selectTagTitle';
  selectItemTagTitle.innerHTML = label2?.firstElementChild.textContent?.trim();

  const customSelect2 = document.createElement('div');
  customSelect2.className = 'custom-select';
  const selectSelected2 = document.createElement('div');
  selectSelected2.className = 'select-selected';
  selectSelected2.textContent = 'Please select';
  selectSelected2.dataset.value = '';
  const arrow2 = document.createElement('img');
  arrow2.className = 'select-arrow';
  arrow2.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
  selectSelected2.appendChild(arrow2);

  const selectItems2 = document.createElement('div');
  selectItems2.className = 'select-items';
  customSelect2.append(selectSelected2, selectItems2);

  // 按钮
  const confirmBtn = document.createElement('button');
  confirmBtn.id = 'confirmBtn';
  confirmBtn.textContent = buttonDiv.firstElementChild.textContent?.trim();

  label1.replaceChildren(selectTagTitle, customSelect1);
  label2.replaceChildren(selectItemTagTitle, customSelect2);
  placeholder1.remove?.();
  placeholder2.remove?.();
  buttonDiv.replaceChildren(confirmBtn);

  if (el.length > 0) {
    el[0].prepend(selectDiv);
  }

  // 分组逻辑
  const items = document.querySelectorAll('.store-information-card-wrapper');
  const groups = {};
  items.forEach((item) => {
    const tag = item?.dataset?.tag;
    if (!groups[tag]) groups[tag] = [];
    groups[tag].push(item);
  });

  const groupKeys = Object.keys(groups);
  groupKeys.forEach((tag, index) => {
    const groupItems = groups[tag];
    const firstItem = groupItems[0];
    const wrapper = document.createElement('div');
    wrapper.className = 'sic-wrapper';
    wrapper.dataset.tag = tag;

    const titleDiv = document.createElement('div');
    titleDiv.className = 'sic-title';
    titleDiv.textContent = tag;
    wrapper.appendChild(titleDiv);

    const segments = window.location.pathname.split('/').filter(Boolean);
    const country = segments[segments[0] === 'content' ? 2 : 0] || '';
    const arrow = document.createElement('img');
    arrow.classList.add('arrow');
    arrow.src = isMobileWindow ? `/content/dam/hisense/${country}/common-icons/up-grey.svg` : `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
    if (index !== 0) {
      arrow.classList.add('hide');
    }

    arrow.addEventListener('click', (e) => {
      e.stopPropagation();
      e?.target?.classList.toggle('hide');
    });
    titleDiv.append(arrow);

    const aWrapper = document.createElement('div');
    aWrapper.className = 'block-wrapper';
    wrapper.appendChild(aWrapper);
    firstItem.parentNode.insertBefore(wrapper, firstItem);
    groupItems.forEach((item) => aWrapper.appendChild(item));
  });

  const aList = document.querySelectorAll('.sic-wrapper');
  const tagSet = new Set();
  aList.forEach((a) => {
    const tag = a.getAttribute('data-tag');
    if (tag) tagSet.add(tag);
  });

  // 渲染第一个下拉框
  selectItems1.innerHTML = `<div data-value="">${placeholder1?.firstElementChild.textContent?.trim()}</div>`;
  tagSet.forEach((tag) => {
    selectItems1.innerHTML += `<div data-value="${tag}">${tag}</div>`;
  });

  // 渲染第二个下拉框
  function renderItemTags(selectedTag) {
    selectItems2.innerHTML = `<div data-value="">${placeholder2?.firstElementChild.textContent?.trim()}</div>`;
    const itemSet = new Set();

    aList.forEach((a) => {
      const tag = a.getAttribute('data-tag');
      if (selectedTag && tag !== selectedTag) return;

      a.querySelectorAll('.store-information-card-wrapper').forEach((b) => {
        const itemTag = b.getAttribute('data-item-tag');
        if (itemTag) itemSet.add(itemTag);
      });
    });

    itemSet.forEach((item) => {
      selectItems2.innerHTML += `<div data-value="${item}">${item}</div>`;
    });
  }

  function initSelect(_selectEl, selectedEl, itemsEl, arrowEl, onChange) {
    selectedEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = itemsEl.style.display === 'block';
      itemsEl.style.display = isOpen ? 'none' : 'block';
      // 箭头展开/关闭自动翻转
      if (itemsEl.style.display === 'block') {
        arrowEl.style.transform = 'rotate(180deg)';
      } else {
        arrowEl.style.transform = 'rotate(0deg)';
      }
    });

    itemsEl.addEventListener('click', (e) => {
      if (e.target.dataset.value !== undefined) {
        selectedEl.textContent = e.target.textContent;
        selectedEl.appendChild(arrowEl);
        selectedEl.dataset.value = e.target.dataset.value;
        itemsEl.style.display = 'none';
        arrowEl.style.transform = 'rotate(0deg)';
        if (onChange) onChange(e.target.dataset.value);
      }
    });

    document.addEventListener('click', () => {
      itemsEl.style.display = 'none';
      arrowEl.style.transform = 'rotate(0deg)';
    });
  }

  // 初始化两个下拉框
  initSelect(customSelect1, selectSelected1, selectItems1, arrow1, (val) => {
    renderItemTags(val);
    selectSelected2.textContent = 'Please select';
    selectSelected2.appendChild(arrow2);
    selectSelected2.dataset.value = '';
  });

  initSelect(customSelect2, selectSelected2, selectItems2, arrow2);

  confirmBtn.addEventListener('click', () => {
    const t = selectSelected1.dataset.value;
    const it = selectSelected2.dataset.value;

    aList.forEach((a) => {
      const { tag } = a.dataset;
      if (t && tag !== t) {
        a.style.display = 'none';
        return;
      }

      const bItems = a.querySelectorAll('.store-information-card-wrapper');
      let hasMatch = false;

      bItems.forEach((b) => {
        const { itemTag } = b.dataset;
        const show = !it || itemTag === it;
        b.style.display = show ? 'block' : 'none';
        if (show) hasMatch = true;
      });

      a.style.display = hasMatch || !it ? 'block' : 'none';
    });
  });

  renderItemTags('');
}
