import { readBlockConfig, decorateIcons } from '../../scripts/aem.js';

const SEARCH_ICON = '/content/dam/hisense/us/common-icons/search-grey-70.svg';

const getUrlParams = (paramName) => {
  const params = new URLSearchParams(window.location.search);
  return params ? params.get(paramName) : null;
};

// 获取Search Input的HTML元素
const getSearchInput = (block) => {
  const config = readBlockConfig(block);
  const searchLink = config['search-link'] || '/search';
  const placeholder = config.placeholder || 'Search';
  const target = config.target || '_self';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'input-wrapper';

  const icon = document.createElement('img');
  icon.className = 'icon icon-search';
  icon.src = SEARCH_ICON;
  inputWrapper.appendChild(icon);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.className = 'search-box-input';
  input.setAttribute('aria-label', placeholder);
  const fullText = getUrlParams('fulltext');
  if (fullText) {
    input.value = fullText;
  }
  inputWrapper.appendChild(input);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'search-box-clear';
  clearBtn.setAttribute('aria-label', 'Clear search');
  clearBtn.type = 'button';
  clearBtn.style.backgroundImage = 'url("/content/dam/hisense/us/common-icons/close-50.svg")';
  clearBtn.style.backgroundSize = 'contain';
  clearBtn.style.backgroundPosition = 'center';
  clearBtn.style.backgroundRepeat = 'no-repeat';
  if (fullText) {
    clearBtn.classList.add('visible');
  }
  inputWrapper.appendChild(clearBtn);

  // Input事件处理
  // 下面三个事件直接添加上，不根据页面缩放调整
  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const url = `${searchLink}?fulltext=${encodeURIComponent(input.value.trim())}`;
      if (target === '_blank') {
        window.open(url, '_blank', 'noopener');
      } else {
        window.location.href = url;
      }
    }
  });

  // Claer Button事件
  const clearBtnHandler = () => {
    clearBtn.classList.toggle('visible', input.value.length > 0);
  };
  input.addEventListener('input', clearBtnHandler);
  return { inputWrapper, input, clearBtn };
};

// 获取Quick Link的HTML元素
const getQuickLink = (block) => {
  const config = readBlockConfig(block);
  const suggestionLabel = config['suggestion-label'];
  let quickLinkIndex = 2;
  if (suggestionLabel?.length) {
    quickLinkIndex = 3;
  }
  const quickLinkList = [...block.children]?.slice(quickLinkIndex);
  if (!quickLinkList?.length) {
    return null;
  }
  // quick link的wrapper
  const quickLinkWrapper = document.createElement('div');
  quickLinkWrapper.className = 'quick-link-wrapper';
  if (suggestionLabel?.length) {
    const suggestionLabelEl = document.createElement('div');
    suggestionLabelEl.className = 'suggestion-label';
    suggestionLabelEl.textContent = suggestionLabel;
    quickLinkWrapper.appendChild(suggestionLabelEl);
  }
  let hasQuickLink = false;
  quickLinkList.forEach((linkElement) => {
    const linkDiv = document.createElement('div');
    linkDiv.className = 'quick-link';
    const link = linkElement?.querySelector('a')?.href ?? '';
    const linkTextElement = linkElement?.children[1];
    const linkText = linkTextElement?.querySelector('p')?.innerHTML ?? '';
    linkDiv.innerHTML = linkText;
    linkDiv.addEventListener('click', () => {
      window.location.href = link;
    });
    if (linkText) {
      quickLinkWrapper.appendChild(linkDiv);
      hasQuickLink = true;
    }
  });
  if (suggestionLabel?.length || hasQuickLink) {
    return quickLinkWrapper;
  }
  return null;
};

const generateAuthorSearchBox = (block) => {
  const config = readBlockConfig(block);
  const suggestionLabel = config['suggestion-label'];
  let quickLinkIndex = 2;
  if (suggestionLabel?.length) {
    quickLinkIndex = 3;
  }
  const [searchLinkEl, placeholderEl, suggesstionEl] = [...block.children];
  const quickLinkList = [...block.children]?.slice(quickLinkIndex);
  placeholderEl.children[0].remove();
  searchLinkEl.remove();
  const outWrapper = document.createElement('div');
  outWrapper.className = 'out-wrapper';
  const inputWrapperEl = document.createElement('div');
  inputWrapperEl.className = 'input-wrapper';
  const searchIconEl = document.createElement('img');
  searchIconEl.classList.add('icon-search');
  searchIconEl.src = SEARCH_ICON;
  inputWrapperEl.appendChild(searchIconEl);
  const inputEl = placeholderEl.children[0].querySelector('p');
  inputEl.classList.add('search-box-input');
  inputWrapperEl.append(inputEl);
  outWrapper.append(inputWrapperEl);
  const quickLinkWrapperEl = document.createElement('div');
  quickLinkWrapperEl.className = 'quick-link-wrapper';
  if (suggestionLabel?.length) {
    suggesstionEl.children[0].remove();
    quickLinkWrapperEl.append(suggesstionEl.children[0]);
    suggesstionEl.classList.add('suggestion-label');
  }
  if (quickLinkList?.length) {
    quickLinkList.forEach((quickLinkEl) => {
      quickLinkEl.children[0].remove();
      const quickLinkTextEl = quickLinkEl.children[0];
      quickLinkTextEl.className = 'quick-link';
      quickLinkWrapperEl.append(quickLinkTextEl);
    });
  }
  block.prepend(outWrapper);
  block.appendChild(quickLinkWrapperEl);
};

export default async function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  if (isEditMode) {
    generateAuthorSearchBox(block);
    return;
  }
  // Input和Quick Link的父级容器
  const searchBoxWrapper = document.createElement('div');
  searchBoxWrapper.className = 'out-wrapper';

  const quickLinkElement = getQuickLink(block);

  // 手机端的input弹窗
  const popupWrapper = document.createElement('div');
  popupWrapper.className = 'popup-wrapper';
  // 此Input是移动端Popup页面的Input
  const { inputWrapper: popupInputWrapper } = getSearchInput(block);
  const cloneInputWrapper = popupInputWrapper;
  cloneInputWrapper.classList.add('popup-input-wrapper');
  const cloneQuickLink = getQuickLink(block);
  const popupSearchWrapper = document.createElement('div');
  popupSearchWrapper.className = 'popup-search-wrapper';
  popupSearchWrapper.appendChild(cloneInputWrapper);
  if (cloneQuickLink) {
    popupSearchWrapper.appendChild(cloneQuickLink);
  }
  popupWrapper.appendChild(popupSearchWrapper);
  searchBoxWrapper.appendChild(popupWrapper);
  popupSearchWrapper.addEventListener('click', (e) => {
    e.stopImmediatePropagation();
  });

  // 显示Popup
  const showPopupHandler = (e) => {
    e.stopImmediatePropagation();
    const elementPosition = searchBoxWrapper.getBoundingClientRect().top;
    const offset = 56;
    // 获取当前滚动位置
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    // 计算目标滚动位置（元素位置 + 当前滚动 - 偏移量）
    const targetPosition = elementPosition + currentScroll - offset;
    // 点击input后，将当前的input框滚动到顶部
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
    popupWrapper.classList.add('visible');
  };
  // 隐藏Popup
  const hidePopupHandler = (e) => {
    e.stopImmediatePropagation();
    popupWrapper.classList.remove('visible');
  };

  // 此Input是Home的Input
  const { inputWrapper, input, clearBtn } = getSearchInput(block);

  const removeAllEvent = () => {
    input.removeEventListener('click', showPopupHandler);
    popupWrapper.removeEventListener('click', hidePopupHandler);
  };

  // 使用 matchMedia API
  const mediaQuery = window.matchMedia('(min-width: 860px)');

  function handleMediaChange(event) {
    removeAllEvent();
    const fullText = getUrlParams('fulltext');
    if (event.matches) {
      // PC
      input.readOnly = false;
      popupWrapper.classList.remove('visible');
    } else {
      // Mobile
      input.readOnly = true;
      input.value = fullText || '';
      if (fullText) {
        clearBtn.classList.add('visible');
      } else {
        clearBtn.classList.remove('visible');
      }
      input.addEventListener('click', showPopupHandler);
      popupWrapper.addEventListener('click', hidePopupHandler);
    }
  }

  // 初始调用
  handleMediaChange(mediaQuery);

  // 监听媒体查询变化
  mediaQuery.addEventListener('change', handleMediaChange);
  searchBoxWrapper.appendChild(inputWrapper);
  if (quickLinkElement) {
    searchBoxWrapper.appendChild(quickLinkElement);
  }

  block.replaceChildren(searchBoxWrapper);
  decorateIcons(block);
  block.classList.add('loaded');
}
