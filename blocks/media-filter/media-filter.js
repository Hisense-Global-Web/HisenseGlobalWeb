import { getLocaleFromPath } from '../../scripts/locale-utils.js';
import { formatIsoToUtcStr } from '../../utils/carousel-common.js';
import { MOCK_DATA } from './mockdata.js';

const mockOptions1 = ['商标', '园区', '活动', '视频', '产品'];
const mockOptions2 = [
  { options: [], parent: '商标' },
  { options: ['海信国际中心', '海信研发中心', '海信国内工业园', '海信海外工业园'], parent: '园区' },
  { options: ['体育营销', '展会峰会', '社会责任'], parent: '活动' },
  { options: ['品牌视频', '体育营销', '园区视频', '产品视频', '社会责任'], parent: '视频' },
  { options: ['智慧生活', '智慧能源', '半导体', '汽车电子', '网络信息', '海信地产'], parent: '产品' },
];

const { country } = getLocaleFromPath();

const generateChevronIcon = (diabled = false) => {
  const chevronIcon = document.createElement('div');
  const iconImg = document.createElement('img');
  if (diabled) {
    iconImg.src = `/content/dam/hisense/${country}/common-icons/bottom-disabled.svg`;
    chevronIcon.className = 'chevron-icon-disabled';
  } else {
    chevronIcon.className = 'chevron-icon';
    iconImg.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
  }
  iconImg.setAttribute('aria-hidden', 'true');
  iconImg.loading = 'lazy';
  chevronIcon.appendChild(iconImg);
  return chevronIcon;
};

const getSubOptions = (block, options, mainValue = null) => {
  let currentMainValue = mainValue;
  if (!currentMainValue) {
    currentMainValue = block.querySelector('.main-select .select-value')?.textContent ?? null;
  }
  return options.filter((option) => option.parent === currentMainValue)[0]?.options ?? [];
};

const setSelectOptionList = (selectOptionListWrapperEl, list, placeholder = null, callback = null) => {
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
        callback?.();
      }
    });
  });

  selectOptionListWrapperEl.appendChild(optionListWrapperEl);
};

const generateSelectEl = (label, placeholder = null) => {
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
  selectValueEl.classList.add('select-value');
  if (placeholder) {
    selectValueEl.classList.add('select-placeholder');
  }
  selectValueEl.textContent = placeholder;
  selectWrapperEl.appendChild(selectValueEl);
  const chevronIcon = generateChevronIcon();
  const chevronDisabledIcon = generateChevronIcon(true);
  selectWrapperEl.append(chevronIcon, chevronDisabledIcon);
  selectOptionListWrapperEl.appendChild(selectWrapperEl);
  setSelectOptionList(selectOptionListWrapperEl, [placeholder], placeholder);
  titleSelectWrapperEl.appendChild(selectOptionListWrapperEl);
  selectOptionListWrapperEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.closest('.select-option-list-wrapper').classList.contains('disabled')) {
      return;
    }
    const selectWrapperList = document.querySelectorAll('.select-option-list-wrapper');
    if (selectWrapperList?.length) {
      const currentSelectParent = e.target.closest('.select-option-list-wrapper').cloneNode(true);
      selectWrapperList.forEach((selectEl) => {
        if (currentSelectParent.className !== selectEl.className) {
          selectEl.classList.remove('show');
        }
      });
    }
    selectOptionListWrapperEl.classList.toggle('show');
  });
  return titleSelectWrapperEl;
};

const getCardList = () => {
  const { list } = MOCK_DATA;
  return list;
};

const getFilterCardList = (dataList, mainSelectValue, subSelectValue, placeholder2Text) => {
  if (!dataList?.length) {
    return [];
  }
  return dataList.filter((item) => {
    let mainMatch = true;
    let subMatch = true;
    if (mainSelectValue) {
      mainMatch = item.type === mainSelectValue;
    }
    if (subSelectValue && subSelectValue !== placeholder2Text) {
      subMatch = item.category === subSelectValue;
    }
    return mainMatch && subMatch;
  });
};

const generateCard = (card) => {
  const {
    title, category, thumbnail, publishDate,
  } = card ?? {};
  const mediaCardEl = document.createElement('div');
  mediaCardEl.className = 'card-wrapper';
  const thumbnailEl = document.createElement('img');
  thumbnailEl.className = 'thumbnail';
  thumbnailEl.src = thumbnail;
  thumbnailEl.alt = title;
  thumbnailEl.loading = 'lazy';
  mediaCardEl.appendChild(thumbnailEl);
  const bottomWrapperEl = document.createElement('div');
  bottomWrapperEl.className = 'bottom-wrapper';
  const textContentEl = document.createElement('div');
  textContentEl.className = 'text-content';
  if (category) {
    const categoryEl = document.createElement('div');
    categoryEl.className = 'category';
    categoryEl.textContent = category;
    textContentEl.appendChild(categoryEl);
  }
  const titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = title;
  textContentEl.appendChild(titleEl);
  bottomWrapperEl.appendChild(textContentEl);
  const dateWrapperEl = document.createElement('div');
  dateWrapperEl.className = 'date-wrapper';
  const dateIconEl = document.createElement('img');
  dateIconEl.className = 'date-icon';
  dateIconEl.src = `/content/dam/hisense/${country}/common-icons/time.svg`;
  dateIconEl.alt = 'Publish Date';
  const dateTextEl = document.createElement('div');
  dateTextEl.className = 'date-text';
  dateTextEl.textContent = formatIsoToUtcStr(publishDate, country);
  dateWrapperEl.append(dateIconEl, dateTextEl);
  bottomWrapperEl.appendChild(dateWrapperEl);
  mediaCardEl.appendChild(bottomWrapperEl);
  return mediaCardEl;
};

// render pagination
const buildPaginationControls = (container, state, onPageChange) => {
  const { total, limit, offset } = state;
  if (total <= limit) {
    return;
  }
  const paginationEl = container.querySelector('.card-list-pagination');
  if (!paginationEl) return;

  paginationEl.textContent = '';

  if (!total ?? !limit ?? (total <= limit)) {
    return;
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const createPaginationButton = (label, page, disabled = false, isActive = false) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('page-button');

    if (label === 'prev') {
      const icon = document.createElement('img');
      icon.src = `/content/dam/hisense/${country}/common-icons/left.svg`;
      icon.className = 'page-arrow is-prev normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = `/content/dam/hisense/${country}/common-icons/left-disabled.svg`;
      disabledIcon.className = 'page-arrow is-prev disabled';
      btn.setAttribute('aria-label', 'Previous page');
      btn.append(icon, disabledIcon);
    } else if (label === 'next') {
      const icon = document.createElement('img');
      icon.src = `/content/dam/hisense/${country}/common-icons/right.svg`;
      icon.className = 'page-arrow is-next normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = `/content/dam/hisense/${country}/common-icons/right-disabled.svg`;
      disabledIcon.className = 'page-arrow is-next disabled';
      btn.setAttribute('aria-label', 'Next page');
      btn.append(icon, disabledIcon);
    } else {
      btn.textContent = label;
    }

    if (isActive) btn.classList.add('is-active');
    if (disabled) {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => onPageChange(page));
    }
    return btn;
  };

  // Prev
  paginationEl.appendChild(
    createPaginationButton('prev', currentPage - 1, currentPage === 1),
  );

  const getVisiblePages = () => {
    const pages = [];

    if (totalPages <= 7) {
      // 总页数少，直接显示所有页
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      // 当前页在前部
      for (let i = 1; i <= 5; i += 1) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // 当前页在后部
      pages.push(1);
      pages.push('ellipsis');
      for (let i = totalPages - 4; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      // 当前页在中部
      pages.push(1);
      pages.push('ellipsis');
      for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();
  visiblePages.forEach((page) => {
    if (page === 'ellipsis') {
      const ellipsis = document.createElement('div');
      ellipsis.className = 'pagination-ellipsis';
      const circle = document.createElement('div');
      circle.className = 'pagination-ellipsis-circle';
      ellipsis.append(circle, circle.cloneNode(), circle.cloneNode());
      paginationEl.appendChild(ellipsis);
    } else {
      paginationEl.appendChild(
        createPaginationButton(String(page), page, false, page === currentPage),
      );
    }
  });

  // Next
  paginationEl.appendChild(
    createPaginationButton('next', currentPage + 1, currentPage === totalPages),
  );
};
const loadPage = (block, options, dataList, type = 'PC') => {
  const {
    currentPage, pageSize, paginationEl, mobileBtn,
  } = options;
  const totalItems = dataList?.length ?? 0;

  const cardList = block.querySelectorAll('.card-wrapper');
  if (cardList?.length) {
    cardList.forEach((info) => {
      info.remove();
    });
  }
  paginationEl.textContent = '';
  mobileBtn.style.display = 'none';

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = type === 'PC' ? dataList.slice(startIndex, startIndex + pageSize) : dataList.slice(0, startIndex + pageSize);

  pageItems.forEach((card) => {
    const cardEl = generateCard(card);
    const cardWrapperEl = block.querySelector('.card-list-wrapper');
    if (cardEl) {
      cardWrapperEl.appendChild(cardEl);
    }
  });

  const state = {
    total: totalItems,
    limit: pageSize,
    offset: startIndex,
  };

  // 创建PC端的分页器
  buildPaginationControls(block, state, (targetPage) => {
    if (targetPage < 1) return;
    const maxPage = Math.ceil(state.total / state.limit);
    if (targetPage > maxPage) return;
    loadPage(block, {
      currentPage: targetPage, pageSize, paginationEl, mobileBtn,
    }, dataList);
  });

  // 给移动端的 Load More 按钮添加事件
  if (currentPage * pageSize < totalItems) {
    mobileBtn.style.display = 'block';
    mobileBtn.onclick = () => loadPage(block, {
      currentPage: safePage + 1, pageSize, paginationEl, mobileBtn,
    }, dataList, 'Mobile');
  } else {
    mobileBtn.style.display = 'none';
  }
};

const handleSearchClick = (block, options, dataList) => {
  const { placeholder2Text, pageSize = 9 } = options;
  const mainSelectValue = block.querySelector('.main-select .select-value')?.textContent ?? null;
  const subSelectValue = block.querySelector('.sub-select .select-value')?.textContent ?? null;
  const filteredData = getFilterCardList(dataList, mainSelectValue, subSelectValue, placeholder2Text);
  const cardList = block.querySelectorAll('.card-wrapper');
  if (cardList?.length) {
    cardList.forEach((info) => {
      info.remove();
    });
  }
  const paginationEl = block.querySelector('.card-list-pagination');
  const mobileBtn = block.querySelector('.card-list-pagination-mobile .page-button');
  loadPage(block, {
    currentPage: 1, pageSize, paginationEl, mobileBtn,
  }, filteredData);
};

export default function decorate(block) {
  const [label1El, label2El, placeholder2El, buttonTextEl, loadMoreEl, pageSizeEL] = [...block.children] ?? [];
  const loadMoreText = loadMoreEl?.textContent ?? 'Load More';
  const pageSize = Number(pageSizeEL?.textContent) || 9;
  const searchCardWrapper = document.createElement('div');
  searchCardWrapper.className = 'search-card-wrapper';
  const searchCardInner = document.createElement('div');
  searchCardInner.className = 'search-card-inner';
  const mainSelectWrapperEl = generateSelectEl(label1El?.textContent ?? '');
  const mainOptionListWrapperEl = mainSelectWrapperEl.querySelector('.select-option-list-wrapper');
  mainOptionListWrapperEl.classList.add('main-select');
  const placeholder2Text = placeholder2El?.textContent ?? '';
  const subSelectWrapperEl = generateSelectEl(label2El?.textContent ?? '', placeholder2Text);
  const subOptionListWrapperEl = subSelectWrapperEl.querySelector('.select-option-list-wrapper');
  subOptionListWrapperEl.classList.add('sub-select');
  const subOptions = getSubOptions(block, mockOptions2, mockOptions1[0]);
  // 初始化dropdown list
  mainOptionListWrapperEl.querySelector('.select-value').textContent = mockOptions1[0] ?? '';
  setSelectOptionList(mainOptionListWrapperEl, mockOptions1, null, () => {
    const currentSubOptions = getSubOptions(block, mockOptions2);
    setSelectOptionList(subOptionListWrapperEl, [placeholder2Text, ...currentSubOptions], placeholder2Text);
    if (currentSubOptions?.length) {
      block.querySelector('.sub-select')?.classList.remove('disabled');
    } else {
      block.querySelector('.sub-select')?.classList.add('disabled');
    }
    const subValue = block.querySelector('.sub-select .select-value');
    if (subValue) {
      subValue.classList.add('select-placeholder');
      subValue.textContent = placeholder2Text;
    }
  });
  setSelectOptionList(subOptionListWrapperEl, [placeholder2Text, ...subOptions], placeholder2Text);
  if (!subOptions?.length) {
    subOptionListWrapperEl?.classList.add('disabled');
  }
  searchCardInner.appendChild(mainSelectWrapperEl);
  searchCardInner.appendChild(subSelectWrapperEl);
  const cardList = getCardList();
  const buttonEl = document.createElement('button');
  buttonEl.className = 'search-button';
  buttonEl.textContent = buttonTextEl?.textContent ?? '';
  buttonEl.addEventListener('click', () => {
    handleSearchClick(block, { placeholder2Text, pageSize }, cardList);
  });
  searchCardInner.appendChild(buttonEl);
  searchCardWrapper.appendChild(searchCardInner);
  block.textContent = '';
  block.appendChild(searchCardWrapper);

  // render media list
  const bottomWrapperEl = document.createElement('div');
  bottomWrapperEl.className = 'bottom-wrapper';
  const cardListWrapperEl = document.createElement('div');
  cardListWrapperEl.className = 'card-list-wrapper';
  const filterDataList = getFilterCardList(cardList, mockOptions1[0], null, placeholder2Text);
  filterDataList.forEach((card) => {
    const cardEl = generateCard(card);
    cardListWrapperEl.appendChild(cardEl);
  });

  // PC分页器
  const paginationEl = document.createElement('div');
  paginationEl.className = 'card-list-pagination';

  // Mobile按钮
  const mobilePaginationEl = document.createElement('div');
  mobilePaginationEl.className = 'card-list-pagination-mobile';
  const mobileBtn = document.createElement('button');
  mobileBtn.type = 'button';
  mobileBtn.classList.add('page-button');
  mobileBtn.textContent = loadMoreText;
  mobilePaginationEl.appendChild(mobileBtn);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.classList.add('page-button');
  btn.textContent = loadMoreText;
  bottomWrapperEl.appendChild(cardListWrapperEl);
  const paginationWrapperEl = document.createElement('div');
  paginationWrapperEl.className = 'pagination-wrapper';
  paginationWrapperEl.append(paginationEl, mobilePaginationEl);
  bottomWrapperEl.appendChild(paginationWrapperEl);
  block.appendChild(bottomWrapperEl);
  loadPage(block, {
    currentPage: 1, pageSize, paginationEl, mobileBtn,
  }, filterDataList);
  block.classList.add('loaded');

  // 点击其他地方时隐藏OptionList
  window.document.addEventListener('click', (e) => {
    const selectListEl = document.querySelectorAll('.select-option-list-wrapper.show');
    const { target } = e;
    const targetWrapper = target.closest('.select-option-list-wrapper');
    if (targetWrapper) {
      if (targetWrapper.classList.contains('show')) {
        targetWrapper.classList.remove('show');
      } else {
        const allWrappers = document.querySelectorAll('.select-option-list-wrapper');
        // 点击当前select时，关闭其他select的option list，并切换当前select的option list显示状态
        allWrappers.forEach((wrapper) => {
          if (wrapper === targetWrapper) {
            wrapper.classList.toggle('show');
          } else if (wrapper.classList.contains('show')) {
            wrapper.classList.remove('show');
          }
        });
      }
    } else if (selectListEl?.length) {
      selectListEl.forEach((selectEl) => {
        selectEl.classList.remove('show');
      });
    }
  });
}
