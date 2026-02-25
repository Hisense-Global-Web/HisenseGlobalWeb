import { readBlockConfig, decorateIcons } from '../../scripts/aem.js';

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
  icon.src = '/content/dam/hisense/us/common-icons/search-grey-70.svg';
  inputWrapper.appendChild(icon);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.className = 'search-box-input';
  input.setAttribute('aria-label', placeholder);
  inputWrapper.appendChild(input);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'search-box-clear';
  clearBtn.setAttribute('aria-label', 'Clear search');
  clearBtn.type = 'button';
  clearBtn.style.backgroundImage = 'url("/content/dam/hisense/us/common-icons/close-50.svg")';
  clearBtn.style.backgroundSize = 'contain';
  clearBtn.style.backgroundPosition = 'center';
  clearBtn.style.backgroundRepeat = 'no-repeat';
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
  const quickLinkList = [...block.children]?.slice(2);
  if (!quickLinkList?.length) {
    return null;
  }
  // quick link的wrapper
  const quickLinkWrapper = document.createElement('div');
  quickLinkWrapper.className = 'quick-link-wrapper';
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
    if (link && linkText) {
      quickLinkWrapper.appendChild(linkDiv);
      hasQuickLink = true;
    }
  });
  if (hasQuickLink) {
    return quickLinkWrapper;
  }
  return null;
};

export default async function decorate(block) {
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
    if (event.matches) {
      // PC
      input.readOnly = false;
      popupWrapper.classList.remove('visible');
    } else {
      // Mobile
      input.readOnly = true;
      input.value = '';
      clearBtn.classList.remove('visible');
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
