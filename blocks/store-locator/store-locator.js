function storeInformationSelect() {
  const el = document.querySelectorAll('.store-information-card-container');
  const selectDiv = document.createElement('div');
  selectDiv.className = 'selectContainer';
  const selectTag = document.createElement('select');
  selectTag.id = 'selectTag';
  const selectItemTag = document.createElement('select');
  selectItemTag.id = 'selectItemTag';
  // 4. 创建确认按钮
  const confirmBtn = document.createElement('button');
  confirmBtn.id = 'confirmBtn';
  confirmBtn.textContent = '确认筛选';
  // 5. 把元素依次放进 div 里
  selectDiv.appendChild(selectTag);
  selectDiv.appendChild(selectItemTag);
  selectDiv.appendChild(confirmBtn);
  if (el.length > 0) {
    el[0].prepend(selectDiv);
  }
  const items = document.querySelectorAll('.store-information-card-wrapper');
  const groups = {};
  items.forEach((item) => {
    const tag = item?.dataset?.tag;
    if (!groups[tag]) groups[tag] = [];
    groups[tag].push(item);
  });

  Object.keys(groups).forEach((tag) => {
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
    arrow.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
    // arrow.setAttribute('data-target-index');
    arrow.addEventListener('click', (e) => {
      e.stopPropagation();
      e?.target?.classList.toggle('hide');
    });
    titleDiv.append(arrow);
    const aWrapper = document.createElement('div');
    aWrapper.className = 'block-wrapper';
    wrapper.appendChild(aWrapper);
    firstItem.parentNode.insertBefore(wrapper, firstItem);

    // 把本组所有元素移动到包裹层内
    groupItems.forEach((item) => aWrapper.appendChild(item));
  });
  const aList = document.querySelectorAll('.sic-wrapper');
  const tagSet = new Set();

  aList.forEach((a) => {
    const tag = a.getAttribute('data-tag');
    if (tag) tagSet.add(tag);
  });
  selectTag.innerHTML = '<option value="">All</option>';
  tagSet.forEach((tag) => {
    selectTag.innerHTML += `<option value="${tag}">${tag}</option>`;
  });
  function renderItemTags(selectedTag) {
    selectItemTag.innerHTML = '<option value="">全部item</option>';
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
      selectItemTag.innerHTML += `<option value="${item}">${item}</option>`;
    });
  }
  // 3. 第一个select变化 → 刷新第二个select（联动）
  selectTag.addEventListener('change', () => {
    renderItemTags(this.value);
  });

  confirmBtn.addEventListener('click', () => {
    const t = selectTag.value;
    const it = selectItemTag.value;

    aList.forEach((a) => {
      const { tag } = a.dataset;

      // 1. 先判断tag是否匹配
      if (t && tag !== t) {
        a.style.display = 'none';
        return;
      }

      // 2. 判断item是否匹配
      const bItems = a.querySelectorAll('.store-information-card-wrapper');
      let hasMatch = false;

      bItems.forEach((b) => {
        const { itemTag } = b.dataset;
        const show = !it || itemTag === it;
        b.style.display = show ? 'block' : 'none';
        if (show) hasMatch = true;
      });

      // 3. 子元素都不匹配 → 隐藏整个 .a
      a.style.display = hasMatch || !it ? 'block' : 'none';
    });
  });

  renderItemTags('');
}

export default function decorate(block) {
  // const config = readBlockConfig(block);
  // const [select1, select2, button] = [...block.children];
  // stage?.parentNode?.parentNode?.setAttribute('data-tag', stage.lastElementChild.textContent?.trim());
  // category.parentNode?.parentNode?.setAttribute('data-item-tag', category.lastElementChild.textContent?.trim());
  // stage?.remove?.();
  // category?.remove?.();
  // // const wrapper = document.createElement('div');
  // // wrapper.className = 'list-card-container';
  // infoList?.forEach((info) => {
  //   if (info.children.length > 1) {
  //     info.className = info.firstElementChild.textContent?.trim();
  //     info.firstElementChild?.remove?.();
  //   } else {
  //     info.className = 'sever-item';
  //   }
  //   // wrapper.append(info);
  // });
  // block.replaceChildren(wrapper);
 
}
