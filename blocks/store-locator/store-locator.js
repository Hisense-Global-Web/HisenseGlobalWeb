const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

const generateChevronIcon = () => {
  const chevronIcon = document.createElement('div');
  chevronIcon.className = 'chevron-icon';
  const iconImg = document.createElement('img');
  iconImg.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
  iconImg.setAttribute('aria-hidden', 'true');
  iconImg.loading = 'lazy';
  chevronIcon.appendChild(iconImg);
  return chevronIcon;
};

const generateNoResult = (noResult) => {
  const noResultEl = document.createElement('div');
  noResultEl.className = 'no-result';
  noResultEl.innerHTML = noResult;
  return noResultEl;
};

const generateStoreEl = (store) => {
  const storeCardEl = store.querySelector('.store-locator-card') ?? null;
  const typeSet = new Set();
  let tag = null;
  if (storeCardEl) {
    const [tagEl, cityStoreEl, contentWrapper1El, contentWrapper2El, label3El, ...typeList] = [...storeCardEl.children] ?? [];
    tag = tagEl?.querySelector('p')?.textContent ?? '';
    tagEl?.remove?.();
    if (cityStoreEl) {
      cityStoreEl.className = 'city-store-wrapper';
      const [cityEl, storeEl] = cityStoreEl?.querySelectorAll('p') ?? [];
      cityEl?.classList?.add('city');
      storeEl?.classList?.add('store');
    }
    const bottomWrapper = document.createElement('div');
    bottomWrapper.className = 'bottom-wrapper';
    if (contentWrapper1El) {
      contentWrapper1El.className = 'content-wrapper';
      const [title, content] = contentWrapper1El?.querySelectorAll('p') ?? [];
      title?.classList?.add('title');
      content?.classList?.add('content');
      bottomWrapper.appendChild(contentWrapper1El);
    }
    if (contentWrapper2El) {
      contentWrapper2El.className = 'content-wrapper';
      const [title, content] = contentWrapper2El?.querySelectorAll('p') ?? [];
      title?.classList?.add('title');
      content?.classList?.add('content');
      bottomWrapper.appendChild(contentWrapper2El);
    }
    if (label3El) {
      label3El.className = 'title';
      const typeWrapperEl = document.createElement('div');
      typeWrapperEl.className = 'type-wrapper';
      typeWrapperEl.appendChild(label3El);
      const typeListWrapperEl = document.createElement('div');
      typeListWrapperEl.className = 'type-list-wrapper';
      if (typeList?.length) {
        typeList.forEach((typeEl) => {
          const iconTextWrapper = typeEl?.children?.[0];
          if (iconTextWrapper) {
            iconTextWrapper.className = 'icon-text-wrapper';
            // eslint-disable-next-line no-unused-vars
            const [icon, text] = [...iconTextWrapper.children] ?? [];
            if (text) {
              text.className = 'type-text';
              typeSet.add(text?.textContent ?? '');
            }
          }
          typeListWrapperEl.appendChild(typeEl);
        });
      }
      typeWrapperEl.appendChild(typeListWrapperEl);
      bottomWrapper.appendChild(typeWrapperEl);
    }
    storeCardEl.appendChild(bottomWrapper);
  }
  return { tag, node: store, typeList: Array.from(typeSet) };
};

const setSelectOptionList = (selectOptionListWrapperEl, list, placeholder) => {
  const oldOptionListWrapperEl = selectOptionListWrapperEl?.querySelector('.option-list-wrapper');
  if (oldOptionListWrapperEl) {
    oldOptionListWrapperEl.remove();
  }
  const optionListWrapperEl = document.createElement('div');
  optionListWrapperEl.className = 'option-list-wrapper';
  const optionListEl = document.createElement('div');
  optionListEl.className = 'option-list';
  const currentSelectdEl = selectOptionListWrapperEl.querySelector('.select-value');
  const currentSelectedValue = currentSelectdEl?.textContent ?? null;
  if (list?.length) {
    list.forEach((option) => {
      const optionEl = document.createElement('div');
      optionEl.textContent = option;
      optionEl.className = 'option';
      if (currentSelectedValue === option) {
        optionEl.classList.add('selected');
      }
      optionListEl.appendChild(optionEl);
    });
  }
  optionListWrapperEl.appendChild(optionListEl);

  [...optionListEl.children].forEach((optionEl) => {
    optionEl.addEventListener('click', () => {
      const selectedOptionList = optionListEl.querySelectorAll('.selected');
      selectedOptionList.forEach((selectedOption) => {
        selectedOption?.classList?.remove('selected');
      });
      const selectedValue = optionEl.textContent ?? null;
      const currentClickSelectdEl = selectOptionListWrapperEl.querySelector('.select-value');
      const currentClickSelectedValue = currentClickSelectdEl?.textContent ?? null;
      if (currentClickSelectedValue !== selectedValue) {
        if (selectedValue) {
          currentSelectdEl.textContent = selectedValue;
          optionEl.classList.add('selected');
        }
        if (selectedValue === placeholder) {
          currentClickSelectdEl.classList.add('select-placeholder');
        } else {
          currentClickSelectdEl.classList.remove('select-placeholder');
        }
      }
    });
  });

  selectOptionListWrapperEl.appendChild(optionListWrapperEl);
};

const generateSelectEl = (label, placeholder) => {
  const titleSelectWrapperEl = document.createElement('div');
  titleSelectWrapperEl.className = 'title-select-wrapper';
  const titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = label;
  titleSelectWrapperEl.appendChild(titleEl);

  const selectOptionListWrapperEl = document.createElement('div');
  selectOptionListWrapperEl.className = 'select-option-list-wrapper';

  const selectWrapperEl = document.createElement('div');
  selectWrapperEl.classList.add('select-wrapper');
  const selectValueEl = document.createElement('div');
  selectValueEl.classList.add('select-value', 'select-placeholder');
  selectValueEl.textContent = placeholder;
  selectWrapperEl.appendChild(selectValueEl);
  const chevronIcon = generateChevronIcon();
  selectWrapperEl.appendChild(chevronIcon);
  selectOptionListWrapperEl.appendChild(selectWrapperEl);
  setSelectOptionList(selectOptionListWrapperEl, [placeholder], placeholder);
  titleSelectWrapperEl.appendChild(selectOptionListWrapperEl);
  selectOptionListWrapperEl.addEventListener('click', (e) => {
    e.stopPropagation();
    selectOptionListWrapperEl.classList.toggle('show');
  });
  return titleSelectWrapperEl;
};

/**
 * 生成tag card list的html元素
 * @param {HTMLElement} block block元素
 * @param {Array} tagList tag的list
 * @param {String} selectedType 当前选择的type的下拉值
 * @param {Array} storeList 检索后的store list
 * @returns tag card list的html元素
 */
const generateTagCardList = (block, tagList, selectedType, storeList) => {
  const { placeholder2 } = block?.dataset ?? {};
  const isEditMode = block.hasAttribute('data-aue-resource');
  const tagCardList = [];
  // 根据tag构建tag card
  tagList.forEach((tag) => {
    const tagCardWrapper = document.createElement('div');
    tagCardWrapper.className = 'tag-card-wrapper';
    const titleWrapperEl = document.createElement('div');
    titleWrapperEl.className = 'title-wrapper';
    const tagEl = document.createElement('div');
    tagEl.textContent = tag;
    tagEl.className = 'tag';
    const headerIcon = generateChevronIcon();
    titleWrapperEl.append(tagEl, headerIcon);
    tagCardWrapper.appendChild(titleWrapperEl);

    // 过滤当前tag下的store，并插入到tag card下
    const currentTagStore = storeList.filter((store) => {
      const hasStore = store.tag === tag;
      if (!hasStore) { // 过滤掉不同的store
        return false;
      }
      if (placeholder2 === selectedType) { // type = placeholder2时显示全部type
        return hasStore;
      }
      const { typeList } = store;
      if (typeList?.indexOf(selectedType) > -1) { // 查找相同type的store
        return true;
      }
      return false;
    });
    const storeLocatorContentEl = document.createElement('div');
    storeLocatorContentEl.className = 'store-locator-content';
    const storeLocatorWrapperEl = document.createElement('div');
    storeLocatorWrapperEl.className = 'store-locator-wrapper';
    if (currentTagStore?.length) {
      currentTagStore.forEach((storeInfo) => {
        storeLocatorWrapperEl.appendChild(storeInfo.node);
      });
      titleWrapperEl.addEventListener('click', () => {
        tagCardWrapper.classList.toggle('expanded');
      });
      // Author端,全部展开
      if (isEditMode) {
        tagCardWrapper.classList.add('expanded');
      }
      storeLocatorContentEl.appendChild(storeLocatorWrapperEl);
      tagCardWrapper.appendChild(storeLocatorContentEl);
      const divideEl = document.createElement('div');
      divideEl.className = 'divide-line';
      tagCardWrapper.append(divideEl);
      tagCardList.push(tagCardWrapper);
    }
  });
  if (tagCardList.length > 0) { // 第一个元素展开
    tagCardList[0].classList.add('expanded');
  }
  return tagCardList;
};

const generatSearchCard = (block) => {
  const {
    label1, placeholder1, label2, placeholder2, button,
  } = block?.dataset ?? {};

  const searchCardWrapperEl = document.createElement('div');
  searchCardWrapperEl.className = 'search-card-wrapper';
  const searchCardInnerEl = document.createElement('div');
  searchCardInnerEl.className = 'search-card-inner';

  const tagSelect = generateSelectEl(label1, placeholder1);
  tagSelect.querySelector('.select-option-list-wrapper').classList.add('tag-select');
  const typeSelect = generateSelectEl(label2, placeholder2);
  typeSelect.querySelector('.select-option-list-wrapper').classList.add('type-select');
  const searchButtonEl = document.createElement('div');
  searchButtonEl.className = 'search-button';
  searchButtonEl.textContent = button;
  searchCardInnerEl.append(tagSelect, typeSelect, searchButtonEl);
  searchCardWrapperEl.appendChild(searchCardInnerEl);
  return searchCardWrapperEl;
};

export default function decorate(block) {
  const { placeholder1, placeholder2, noresult } = block?.dataset ?? {};
  const storeChildren = [...block.children] ?? [];
  const searchCardWrapper = generatSearchCard(block);
  block.prepend(searchCardWrapper);
  const storeList = [];
  // 构建store card
  storeChildren.forEach((store) => {
    const { tag, node, typeList } = generateStoreEl(store);
    storeList.push({ tag, node, typeList });
  });
  const tagCardListWrapperEl = document.createElement('div');
  tagCardListWrapperEl.className = 'tag-card-list-wrapper';
  let allTagList = [];
  // 去重获取taglist和typelist
  if (storeList?.length) {
    const allTagSet = new Set();
    let allTypeList = [];
    storeList.forEach((store) => {
      const { tag, typeList } = store;
      allTagSet.add(tag);
      allTypeList = allTypeList.concat(typeList);
    });
    allTagList = Array.from(allTagSet).sort();
    allTypeList = Array.from(new Set(allTypeList)).sort();

    if (allTagList?.length) {
      const tagCardList = generateTagCardList(block, allTagList, placeholder2, storeList);
      if (tagCardList) {
        tagCardList.forEach((tagCardEl) => {
          tagCardListWrapperEl.appendChild(tagCardEl);
        });
      } else {
        tagCardListWrapperEl.appendChild(generateNoResult(noresult));
      }
      const tagSelectEl = searchCardWrapper.querySelector('.tag-select');
      if (tagSelectEl) {
        setSelectOptionList(tagSelectEl, [placeholder1, ...allTagList], placeholder1);
      }

      const typeSelectEl = searchCardWrapper.querySelector('.type-select');
      if (typeSelectEl) {
        setSelectOptionList(typeSelectEl, [placeholder2, ...allTypeList], placeholder2);
      }
    } else {
      tagCardListWrapperEl.appendChild(generateNoResult(noresult));
    }
  } else {
    tagCardListWrapperEl.appendChild(generateNoResult(noresult));
  }

  block.appendChild(tagCardListWrapperEl);

  // Search button点击事件
  searchCardWrapper.querySelector('.search-button')?.addEventListener('click', () => {
    const tagSelectEl = searchCardWrapper.querySelector('.tag-select');
    const selectedTag = tagSelectEl?.querySelector('.select-value')?.textContent ?? '';
    const typeSelectEl = searchCardWrapper.querySelector('.type-select');
    const selectedType = typeSelectEl?.querySelector('.select-value')?.textContent ?? '';
    let selectedTagList = [];
    if (selectedTag === placeholder1) {
      selectedTagList = allTagList;
    } else {
      selectedTagList = allTagList.filter((tag) => tag === selectedTag);
    }
    tagCardListWrapperEl.innerHTML = '';
    const searchTagCardList = generateTagCardList(block, selectedTagList, selectedType, storeList);
    if (searchTagCardList?.length) {
      searchTagCardList.forEach((tagCard) => {
        tagCardListWrapperEl.appendChild(tagCard);
      });
    } else {
      tagCardListWrapperEl.appendChild(generateNoResult(noresult));
    }
  });

  // 点击其他地方时隐藏OptionList
  window.document.addEventListener('click', () => {
    const selectListEl = document.querySelectorAll('.select-option-list-wrapper.show');
    if (selectListEl?.length) {
      selectListEl.forEach((selectEl) => {
        selectEl.classList.remove('show');
      });
    }
  });
}
