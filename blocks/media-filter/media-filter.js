import { getLocaleFromPath } from '../../scripts/locale-utils.js';

const mockOptions1 = ['商标', '园区', '活动', '视频', '产品'];
const mockOptions2 = [
  { options: [], parent: '商标' },
  { options: ['海信国际中心', '海信研发中心', '海信国内工业园', '海信海外工业园'], parent: '园区' },
  { options: ['体育营销', '展会峰会', '社会责任'], parent: '活动' },
  { options: ['品牌视频', '体育营销', '园区视频', '产品视频', '社会责任'], parent: '视频' },
  { options: ['智慧生活', '智慧能源', '半导体', '汽车电子', '网络信息', '海信地产'], parent: '产品' },
];

const generateChevronIcon = (diabled = false) => {
  const { country } = getLocaleFromPath();
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

export default function decorate(block) {
  const [label1El, label2El, placeholder2El, buttonTextEl] = [...block.children] ?? [];
  const searchCardWrapper = document.createElement('div');
  searchCardWrapper.className = 'search-card-wrapper';
  const searchCardInner = document.createElement('div');
  searchCardInner.className = 'search-card-inner';
  const mainSelectWrapperEl = generateSelectEl(label1El?.textContent ?? '');
  const mainOptionListWrapperEl = mainSelectWrapperEl.querySelector('.select-option-list-wrapper');
  mainOptionListWrapperEl.classList.add('main-select');
  const placeholder2 = placeholder2El?.textContent ?? '';
  const subSelectWrapperEl = generateSelectEl(label2El?.textContent ?? '', placeholder2);
  const subOptionListWrapperEl = subSelectWrapperEl.querySelector('.select-option-list-wrapper');
  subOptionListWrapperEl.classList.add('sub-select');
  const subOptions = getSubOptions(block, mockOptions2, mockOptions1[0]);
  // 初始化dropdown list
  mainOptionListWrapperEl.querySelector('.select-value').textContent = mockOptions1[0] ?? '';
  setSelectOptionList(mainOptionListWrapperEl, mockOptions1, null, () => {
    const currentSubOptions = getSubOptions(block, mockOptions2);
    setSelectOptionList(subOptionListWrapperEl, [placeholder2, ...currentSubOptions], placeholder2);
    if (currentSubOptions?.length) {
      block.querySelector('.sub-select')?.classList.remove('disabled');
    } else {
      block.querySelector('.sub-select')?.classList.add('disabled');
    }
    const subValue = block.querySelector('.sub-select .select-value');
    if (subValue) {
      subValue.classList.add('select-placeholder');
      subValue.textContent = placeholder2;
    }
  });
  setSelectOptionList(subOptionListWrapperEl, [placeholder2, ...subOptions], placeholder2);
  if (!subOptions?.length) {
    subOptionListWrapperEl?.classList.add('disabled');
  }
  searchCardInner.appendChild(mainSelectWrapperEl);
  searchCardInner.appendChild(subSelectWrapperEl);
  const buttonEl = document.createElement('button');
  buttonEl.className = 'search-button';
  buttonEl.textContent = buttonTextEl?.textContent ?? '';
  searchCardInner.appendChild(buttonEl);
  searchCardWrapper.appendChild(searchCardInner);
  block.textContent = '';
  block.appendChild(searchCardWrapper);

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
