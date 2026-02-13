import { readBlockConfig, decorateIcons } from '../../scripts/aem.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const searchLink = config['search-link'] || '/search';
  const placeholder = config.placeholder || 'Search';
  const target = config.target || '_self';

  // Input和Quick Link的父级容器
  const searchBoxWrapper = document.createElement('div');
  searchBoxWrapper.className = 'out-wrapper';

  // Input的wrapper
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

  input.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', input.value.length > 0);
  });

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
  searchBoxWrapper.appendChild(inputWrapper);

  // 获取QuickLink List
  const quickLinkList = [...block.children]?.slice(2);
  if (quickLinkList?.length) {
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
      searchBoxWrapper.appendChild(quickLinkWrapper);
    }
  }

  block.replaceChildren(searchBoxWrapper);
  decorateIcons(block);
  block.classList.add('loaded');
}
