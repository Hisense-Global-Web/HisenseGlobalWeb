import { loadFragment } from '../fragment/fragment.js';
import { refreshHybrisAuthStatus, startHybrisLogin } from '../../scripts/hybris-bff.js';
import { getFragmentPath } from '../../scripts/locale-utils.js';
import { processPath } from '../../utils/carousel-common.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
function parseLogo(root) {
  const logoImg = root.querySelector('.navigation-logo-wrapper img');
  const logoHref = root.querySelector('.navigation-logo-wrapper a')?.href || '';
  return {
    src: logoImg?.src || '',
    href: processPath(logoHref),
    alt: logoImg?.alt || 'logo',
  };
}

function parseNavItems(root) {
  return Array.from(root.querySelectorAll('.navigation-item-wrapper')).map((wrapper) => {
    const pList = wrapper.querySelectorAll('.navigation-item>div');
    const title = pList[1]?.textContent?.trim() || '';
    const href = pList[0]?.textContent?.trim() || '#';
    return { title, href: processPath(href) };
  });
}
function parseNavLinks(root) {
  return Array.from(root.querySelectorAll('.navigation-link-wrapper')).map((wrapper) => {
    const title = wrapper.querySelector('p:not(.button-container)')?.textContent?.trim() || '';
    const href = wrapper.querySelector('a')?.href || '#';
    return { title, href: processPath(href) };
  });
}

function fixImageUrl(originalSrc) {
  let img = '';
  if (!originalSrc) return img;
  try {
    const urlObj = new URL(originalSrc);
    const { pathname } = urlObj;
    img = `.${pathname}`;
  } catch (e) {
    img = originalSrc.startsWith('./') ? originalSrc : `./${originalSrc}`;
  }
  return img;
}

function parseActions(root) {
  return Array.from(root.querySelectorAll('.navigation-action-wrapper')).map((wrapper) => {
    const title = wrapper.querySelector('p:not(.button-container)')?.textContent?.trim() || '';
    const href = wrapper.querySelector('a')?.href || '#';
    const picList = wrapper.querySelectorAll('img');
    const lightSrc = picList[0]?.src || '';
    let darkSrc = '';
    if (picList.length > 1) {
      darkSrc = picList[1]?.src || '';
    }
    const img = fixImageUrl(lightSrc);
    const darkImg = fixImageUrl(darkSrc);
    let enableSearchBox = false;
    // 判断Enable Search Box
    const navigationActionEl = wrapper.querySelector('.navigation-action');
    if (navigationActionEl?.children?.length === 5) {
      const strEnableSearchBox = navigationActionEl?.children[4].querySelector('p').textContent;
      enableSearchBox = strEnableSearchBox.toLowerCase() === 'true';
    }
    return {
      title, href: processPath(href), img, darkImg, enableSearchBox,
    };
  });
}

function parseCompany(root) {
  return Array.from(root.querySelectorAll('.company-navigation-item-wrapper')).map((wrapper) => {
    const ItemEl = wrapper.querySelector('.company-navigation-item');
    const title = ItemEl.children[0]?.children[0].innerHTML || '';
    const href = ItemEl.children[1]?.textContent?.trim() || '#';
    return { title, href: processPath(href) };
  });
}

function buildSearchTagParams(tagsText) {
  return String(tagsText || '')
    .split(',')
    .map((tag) => {
      const parts = tag.trim().split('/');
      if (parts.length >= 2) {
        const key = parts[parts.length - 2];
        const value = parts[parts.length - 1];
        return `${key}=${value}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('&');
}

function appendSearchTagsToHref(href, tagsText) {
  if (!href || href === '#') return href;

  const tagParams = buildSearchTagParams(tagsText);
  if (!tagParams) return href;

  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}${tagParams}`;
}

function getSupportSubMenuLinkData(item) {
  const title = item.children[2]?.textContent?.trim() || '';
  const linkCell = item.children[3];
  const rawHref = linkCell?.querySelector('a')?.getAttribute('href') || linkCell?.textContent?.trim() || '#';
  const searchTags = item.children[4]?.textContent?.trim() || '';

  return {
    title,
    href: processPath(appendSearchTagsToHref(rawHref, searchTags)),
  };
}

function getSubMenuLinkData(item) {
  const directChildren = Array.from(item.children);

  const imageCell = directChildren.find((child) => child.matches?.('[data-aue-prop="image"]'))
    || directChildren.find((child) => child.querySelector('picture, img'));
  const linkCell = directChildren.find((child) => child.matches?.('[data-aue-prop="link"]'))
    || directChildren.find((child) => child.querySelector('a'));
  const searchTagsCell = directChildren.find((child) => child.matches?.('[data-aue-prop="searchTags"]'))
    || directChildren.find((child) => child.textContent.trim().startsWith('hisense:'));

  const textCells = directChildren.filter((child) => child !== imageCell
    && child !== linkCell
    && child !== searchTagsCell
    && child.textContent.trim());

  const altCell = directChildren.find((child) => child.matches?.('[data-aue-prop="alt"]'))
    || textCells[0];
  const titleCell = directChildren.find((child) => child.matches?.('[data-aue-prop="title"]'))
    || textCells.find((child) => child !== altCell)
    || textCells[1]
    || textCells[0];

  const rawHref = linkCell?.querySelector('a')?.getAttribute('href')
    || linkCell?.textContent?.trim()
    || '#';
  const searchTags = searchTagsCell?.textContent?.trim() || '';

  return {
    img: imageCell?.querySelector('img')?.src || '',
    altText: altCell?.textContent?.trim() || '',
    text: titleCell?.textContent?.trim() || '',
    href: processPath(appendSearchTagsToHref(rawHref, searchTags)),
  };
}

function parseDropdownProducts(col) {
  if (!col) return [];

  const subMenuLinkItems = Array.from(col.querySelectorAll('.sub-menu-link'));

  if (subMenuLinkItems.length) {
    return subMenuLinkItems.map((item) => getSubMenuLinkData(item));
  }

  const products = [];
  const children = Array.from(col.children);

  // 找到所有的picture元素作为分组标识
  const pictures = children.filter((child) => child.tagName === 'P' && child.querySelector('picture'));
  const pictureIndices = pictures.map((pic) => children.indexOf(pic));

  // 为每个分组创建数组
  for (let i = 0; i < pictureIndices.length; i += 1) {
    const startIdx = pictureIndices[i];
    const endIdx = i < pictureIndices.length - 1 ? pictureIndices[i + 1] : children.length;

    // 获取当前分组的所有元素
    const groupElements = children.slice(startIdx, endIdx);

    // 解析分组数据
    const img = groupElements[0].querySelector('img')?.src || '';
    const altText = groupElements[1]?.textContent.trim() || '';
    const text = groupElements[2]?.textContent.trim() || '';
    const linkElement = groupElements[3]?.querySelector('a');
    let href = linkElement?.href || linkElement?.textContent.trim() || '#';

    // 检查是否有一个元素作为标签配置
    if (groupElements[4] && groupElements[4].textContent.trim()) {
      const tagsText = groupElements[4].textContent.trim();
      href = appendSearchTagsToHref(href, tagsText);
    }

    products.push({
      img, text, href: processPath(href), altText,
    });
  }
  return products;
}

function parseDropdownLinks(col) {
  if (!col) return [];
  const subMenuLinkItems = Array.from(col.querySelectorAll('.sub-menu-link'));

  if (subMenuLinkItems.length) {
    return subMenuLinkItems
      .map((item) => getSubMenuLinkData(item))
      .filter((item) => item.text);
  }

  const results = [];
  const items = Array.from(col.querySelectorAll('p'));
  items.forEach((item, index) => {
    const anchor = item.querySelector('a');
    if (!anchor) return;

    const rawHref = anchor.getAttribute('href') || item.textContent.trim() || '#';
    const titleText = items[index - 1]?.textContent.trim() || '';
    const altCandidate = items[index - 2];
    const altText = altCandidate
      && !altCandidate.querySelector('a')
      && !altCandidate.querySelector('picture')
      && !altCandidate.textContent.trim().startsWith('hisense:')
      ? altCandidate.textContent.trim()
      : '';
    const nextText = items[index + 1]?.textContent.trim() || '';
    const href = appendSearchTagsToHref(rawHref, nextText.startsWith('hisense:') ? nextText : '');

    if (titleText) {
      results.push({
        text: titleText,
        href: processPath(href),
        altText,
      });
    }
  });
  return results;
}

function parseDropdownBtns(col) {
  if (!col) return [];

  const results = [];
  const subMenuLinks = col.querySelectorAll('.sub-menu-link');
  if (subMenuLinks.length > 0) {
    subMenuLinks.forEach((subMenuLink) => {
      const { altText, text, href } = getSubMenuLinkData(subMenuLink);

      if (text) {
        results.push({ text, href, altText });
      }
    });
    return results;
  }

  const paragraphs = Array.from(col.querySelectorAll('p'));
  paragraphs.forEach((paragraph, index) => {
    const anchor = paragraph.querySelector('a');
    if (!anchor) {
      return;
    }

    const rawHref = anchor.getAttribute('href') || '#';
    const titleText = paragraphs[index - 1]?.textContent.trim() || '';
    const previousParagraph = paragraphs[index - 2];
    const previousText = previousParagraph?.textContent.trim() || '';
    const nextText = paragraphs[index + 1]?.textContent.trim() || '';
    const altText = previousText
      && !previousText.startsWith('hisense:')
      && !previousParagraph?.querySelector('a')
      && !previousParagraph?.querySelector('picture')
      ? previousText
      : '';

    if (!titleText || titleText.startsWith('hisense:')) {
      return;
    }

    results.push({
      text: titleText,
      href: processPath(appendSearchTagsToHref(rawHref, nextText.startsWith('hisense:') ? nextText : '')),
      altText,
    });
  });

  return results;
}

function parseDropdowns(root) {
  return Array.from(root.querySelectorAll('.columns-container')).map((container) => {
    const block = container.querySelector('.columns.block');
    const row = block?.querySelector(':scope > div');
    const [productsCol, linksCol, btnsCol] = row ? Array.from(row.children) : [];
    return {
      products: parseDropdownProducts(productsCol),
      links: parseDropdownLinks(linksCol),
      btns: parseDropdownBtns(btnsCol),
    };
  });
}

function buildDropdown(data) {
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-dropdown';
  const content = document.createElement('div');
  content.className = 'dropdown-content h-grid-container';

  const main = document.createElement('div');
  main.className = 'dropdown-main';

  const productsWrap = document.createElement('div');
  productsWrap.className = 'dropdown-products';
  data.products.forEach((item) => {
    const product = document.createElement('div');
    product.className = 'dropdown-product';
    const imgWrap = document.createElement('div');
    imgWrap.className = 'dropdown-product-img';
    if (item.img) {
      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.altText || '';
      imgWrap.append(img);
    }
    if (item.href && item.href !== '#') {
      product.dataset.href = item.href;
      product.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = item.href;
      });
    }
    const text = document.createElement('div');
    text.className = 'dropdown-product-text';
    text.textContent = item.text || '';
    product.append(imgWrap, text);
    productsWrap.append(product);
  });

  const linksWrap = document.createElement('div');
  linksWrap.className = 'dropdown-links';
  data.links.forEach((link) => {
    const div = document.createElement('div');
    const a = link.href && link.href !== '#' ? document.createElement('a') : document.createElement('div');
    a.href = processPath(link.href);
    a.textContent = link.text;
    div.append(a);
    div.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    linksWrap.append(div);
  });

  main.append(productsWrap, linksWrap);

  const btnWrap = document.createElement('div');
  btnWrap.className = 'dropdown-btns';
  data.btns.forEach((btnData) => {
    const link = document.createElement('a');
    link.className = 'dropdown-btn';
    link.textContent = btnData.text || '';
    link.href = btnData.href || '#';
    btnWrap.append(link);
  });

  content.append(main, btnWrap);
  dropdown.append(content);
  return dropdown;
}

function buildSupportDropdown(mainEl) {
  const supportEl = mainEl.querySelector('.support-navigation-route-container');
  if (!supportEl) { return; }
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-dropdown';
  const content = document.createElement('div');
  content.className = 'dropdown-content h-grid-container';

  const main = document.createElement('div');
  main.className = 'dropdown-main';

  const productsWrap = document.createElement('div');
  productsWrap.className = 'dropdown-products';
  const supportRouteBaseList = supportEl.querySelector('.support-navigation-route-wrapper .support-navigation-route');

  // support route 标题
  const supportRouteEl = document.createElement('div');
  supportRouteEl.className = 'support-route';
  const supportRouteTitleEl = document.createElement('div');
  supportRouteTitleEl.className = 'support-route-title';
  supportRouteTitleEl.innerHTML = 'Support';
  supportRouteEl.append(supportRouteTitleEl);

  // support route group
  const supportRouteGroupEl = document.createElement('div');
  supportRouteGroupEl.className = 'support-route-group';
  [...supportRouteBaseList.children].forEach((item) => {
    const link = document.createElement('div');
    link.className = 'nav-link';
    const title = item.children[0]?.textContent?.trim() || '';
    const href = item.children[1]?.textContent?.trim() || '#';
    const span1 = document.createElement('span');
    span1.textContent = title;
    link.append(span1);
    if (href && href !== '#') {
      link.dataset.href = processPath(href);
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = processPath(href);
      });
    } else {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    supportRouteGroupEl.append(link);
  });
  supportRouteEl.append(supportRouteGroupEl);
  productsWrap.append(supportRouteEl);

  // support product list
  const supportProductBaseList = supportEl.querySelectorAll('.support-navigation-products-links-wrapper .support-navigation-products-links');
  supportProductBaseList.forEach((proGroup) => {
    const supportProductEl = document.createElement('div');
    supportProductEl.className = 'support-product';

    [...proGroup.children].forEach((item, index) => {
      if (index) {
        const i = item.lastElementChild.textContent?.trim();
        const supportProductListEl = supportProductEl.querySelector('.support-product-list');
        const hasGroup = supportProductListEl.querySelector(`.support-product-order-${i}`) !== null;
        if (!hasGroup) {
          const orderGroup = document.createElement('div');
          orderGroup.className = `support-product-item support-product-order-${i}`;
          supportProductListEl.append(orderGroup);
        }
        const supportProductListGroupEl = supportProductListEl.querySelector(`.support-product-order-${i}`);
        const link = document.createElement('div');
        link.className = 'nav-link';
        const { title, href } = getSupportSubMenuLinkData(item);
        const span1 = document.createElement('span');
        span1.textContent = title;
        link.append(span1);
        if (href && href !== '#') {
          link.dataset.href = processPath(href);
          link.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = processPath(href);
          });
        } else {
          link.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
        supportProductListGroupEl.append(link);
      } else {
        const supportProductTitleEl = document.createElement('div');
        supportProductTitleEl.className = 'support-product-title';
        supportProductTitleEl.innerHTML = item.textContent?.trim();
        const supportProductListEl = document.createElement('div');
        supportProductListEl.className = 'support-product-list';
        supportProductEl.append(supportProductTitleEl, supportProductListEl);
      }
    });
    productsWrap.append(supportProductEl);
  });

  const linksWrap = document.createElement('div');
  linksWrap.className = 'dropdown-links';
  const supportMenuLinksList = supportEl.querySelector('.support-navigation-menu-links-wrapper .support-navigation-menu-links');
  if (supportMenuLinksList) {
    [...supportMenuLinksList.children].forEach((item) => {
      const { title, href } = getSupportSubMenuLinkData(item);
      const div = document.createElement('div');
      const a = href && href !== '#' ? document.createElement('a') : document.createElement('div');
      a.href = processPath(href);
      a.textContent = title;
      div.append(a);
      div.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      linksWrap.append(div);
    });
  }

  main.append(productsWrap, linksWrap);
  content.append(main);
  dropdown.append(content);
  // eslint-disable-next-line consistent-return
  return dropdown;
}

// function convertToDarkSvgUrl(url) {
//   if (url.indexOf('media_103e6c351d7632f9d1aa6d5846df24dd13b5df660') !== -1) {
//     return url.replace('media_103e6c351d7632f9d1aa6d5846df24dd13b5df660', 'media_1b07abf87c6eb9531442a0199bd2893ddb8b1244b');
//   }
//   if (url.indexOf('media_124969b71abd4f3be2869305b3210ba27a9621bb7') !== -1) {
//     return url.replace('media_124969b71abd4f3be2869305b3210ba27a9621bb7', 'media_152ebd74eb043f4b073908ae990437f464ba966a2');
//   }
//   if (url.indexOf('media_1bc02a8ed257ee0b6e75db327f697525ca4681e9c') !== -1) {
//     return url.replace('media_1bc02a8ed257ee0b6e75db327f697525ca4681e9c', 'media_1d67117bba695f4cd4248983772bdd968834d3be6');
//   }
//
//   const [mainPart, ...restParts] = url.split(/[?#]/);
//   const suffix = restParts.length > 0 ? `/${restParts.join('/')}` : '';
//
//   const darkMainPart = mainPart.replace(/\.svg$/, '-dark.svg');
//
//   return darkMainPart + suffix;
// }

let hideSearchBoxPopupTimer = null;

const getUrlParams = (paramName) => {
  const params = new URLSearchParams(window.location.search);
  return params ? params.get(paramName) : null;
};

const getSearchBoxInputWrapperEl = (searchBoxPopupEl) => searchBoxPopupEl.querySelectorAll('.input-wrapper')[1];

const setSearchBoxInput = (inputWrapperEl) => {
  const inputEl = inputWrapperEl.querySelector('input');
  const clearButtonEl = inputWrapperEl.querySelector('.search-box-clear');
  const fullText = getUrlParams('fulltext');
  if (fullText) {
    clearButtonEl.classList.add('visible');
  } else {
    clearButtonEl.classList.remove('visible');
  }
  inputEl.value = fullText || '';
};

const checkMobileSearchBox = (inputWrapperEl) => {
  if (window.innerWidth < 860) {
    const inputEl = inputWrapperEl.querySelector('input');
    inputEl.removeAttribute('readonly');
    inputWrapperEl.classList.add('input-wrapper-mobile');
    inputEl.addEventListener('click', (e) => {
      e.stopImmediatePropagation(); // 阻止其他 click 监听器执行
      e.stopPropagation();
    }, true);
  }
};
const toggleSearchBoxPopup = (e) => {
  e.stopPropagation();
  clearTimeout(hideSearchBoxPopupTimer);
  const searchBoxPopupEl = document.querySelector('.search-box-popup');
  const inputWrapperEl = getSearchBoxInputWrapperEl(searchBoxPopupEl);
  if ([...searchBoxPopupEl.classList].includes('show')) {
    setSearchBoxInput(inputWrapperEl);
    searchBoxPopupEl.classList.remove('show');
  } else {
    setSearchBoxInput(inputWrapperEl);
    searchBoxPopupEl.classList.add('show');
  }
};

// 显示模态框
const showSearchBoxPopup = (e) => {
  e.stopPropagation();
  clearTimeout(hideSearchBoxPopupTimer);
  const searchBoxPopupEl = document.querySelector('.search-box-popup');
  if ([...searchBoxPopupEl.classList].includes('show')) {
    const inputWrapperEl = getSearchBoxInputWrapperEl(searchBoxPopupEl);
    if (searchBoxPopupEl) {
      checkMobileSearchBox(inputWrapperEl);
      searchBoxPopupEl.classList.add('show');
    }
  }
};

const checkSearchBoxPopup = () => {
  const searchBoxPopupEl = document.querySelector('.search-box-popup');
  if ([...searchBoxPopupEl.classList].includes('show')) {
    clearTimeout(hideSearchBoxPopupTimer);
  }
};

// 隐藏模态框（带延迟）
const hideSearchBoxPopup = (e) => {
  e.stopPropagation();
  hideSearchBoxPopupTimer = setTimeout(() => {
    const searchBoxPopupEl = document.querySelector('.search-box-popup');
    const inputWrapperEl = getSearchBoxInputWrapperEl(searchBoxPopupEl);
    if (searchBoxPopupEl) {
      setSearchBoxInput(inputWrapperEl);
      searchBoxPopupEl.classList.remove('show');
    }
  }, 200);
};

const buildSearchBoxPopup = (mainEl) => {
  const searchBoxEl = mainEl.querySelector('.search-box-container');
  if (!searchBoxEl) { return; }
  searchBoxEl.classList.add('search-box-width');
  const searchBoxOuterEl = document.createElement('div');
  searchBoxOuterEl.className = 'search-box-outer';
  searchBoxOuterEl.appendChild(searchBoxEl);
  searchBoxOuterEl.addEventListener('mouseenter', showSearchBoxPopup);
  searchBoxOuterEl.addEventListener('mouseleave', hideSearchBoxPopup);
  // eslint-disable-next-line consistent-return
  return searchBoxOuterEl;
};

const handleChangeNavPosition = (navigation) => {
  const pdpEl = document.querySelector('.product-section-container');
  const plpEl = document.querySelector('.product-sorting');
  if (window.innerWidth < 860 && (pdpEl || plpEl)) {
    navigation.style.position = 'absolute';
    // navigation.style.transition = 'none';
  } else {
    navigation.style.position = '';
    navigation.style.transition = '';
  }
};

const setHeaderActionLoadingState = (element, isLoading) => {
  if (!element) {
    return;
  }

  element.dataset.loading = isLoading ? 'true' : 'false';
  element.classList.toggle('is-loading', isLoading);
  if (isLoading) {
    element.setAttribute('aria-busy', 'true');
  } else {
    element.removeAttribute('aria-busy');
  }
};

const scheduleHeaderActionLoadingReset = (element, delay = 1500) => {
  if (!element) {
    return;
  }

  window.setTimeout(() => {
    if (!document.body.contains(element) || document.visibilityState === 'hidden') {
      return;
    }
    setHeaderActionLoadingState(element, false);
  }, delay);
};

const handleAccountActionClick = async (event) => {
  event.stopPropagation();
  const actionButton = event.currentTarget;
  if (actionButton?.dataset.loading === 'true') {
    return;
  }

  setHeaderActionLoadingState(actionButton, true);

  try {
    const status = await refreshHybrisAuthStatus({ force: true });
    if (status?.authenticated && status.myAccountUrl) {
      scheduleHeaderActionLoadingReset(actionButton);
      window.location.href = status.myAccountUrl;
      return;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to resolve Hybris auth status', error);
  }

  try {
    scheduleHeaderActionLoadingReset(actionButton);
    startHybrisLogin(window.location.href);
  } catch (error) {
    setHeaderActionLoadingState(actionButton, false);
    throw error;
  }
};

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navPath = getFragmentPath('nav');
  const fragment = await loadFragment(navPath);
  // 解析原始DOM
  const logo = parseLogo(fragment);
  const navItems = parseNavItems(fragment);
  const navLinks = parseNavLinks(fragment);
  const actions = parseActions(fragment);
  const dropdowns = parseDropdowns(fragment);
  const company = parseCompany(fragment);

  // 构建新的导航DOM
  const navigation = document.createElement('div');
  navigation.id = 'navigation';
  // eslint-disable-next-line no-unused-vars
  const pdpEl = document.querySelector('.product-section-container');
  // eslint-disable-next-line no-unused-vars
  const plpEl = document.querySelector('.product-sorting');
  const isCompanyPage = window.location.pathname.includes('company');
  const isSupportPage = window.location.pathname.includes('support');
  if (isCompanyPage) {
    navigation.classList.add('is-company');
    if (window.innerWidth >= 1180 && !window.location.pathname.includes('about-us')) {
      document.documentElement.style.setProperty('--nav-height', '166px');
    }
  }
  if (isSupportPage) {
    navigation.classList.add('is-support');
    document.documentElement.style.setProperty('--nav-height', '100px');
  }
  window.addEventListener('resize', () => {
    handleChangeNavPosition(navigation);
  });
  handleChangeNavPosition(navigation);
  let lastScrollTop = 0;
  const scrollThreshold = 10;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (isCompanyPage || isSupportPage) {
      navigation.style.top = window.innerWidth < 1180 ? `${Math.max(scrollTop * -1, -56)}px` : `${Math.max(scrollTop * -1, -84)}px`;
      return;
    }
    if (isSupportPage) {
      if (window.innerWidth < 1180) {
        navigation.style.top = `${Math.max(scrollTop * -1, -56)}px`;
        return;
      }
    }
    if (Math.abs(scrollTop - lastScrollTop) <= scrollThreshold) {
      return;
    }
    if (scrollTop > lastScrollTop) {
      navigation.classList.add('hidden');
    } else {
      navigation.classList.remove('hidden');
    }
    lastScrollTop = scrollTop;
  });

  const navContainer = document.createElement('div');
  navContainer.className = 'nav-container h-grid-container';

  const logoEl = document.createElement('div');
  logoEl.className = 'nav-logo';
  if (logo.src) {
    const a = logo.href ? document.createElement('a') : document.createElement('div');
    a.href = logo.href;
    const img = document.createElement('img');
    img.src = logo.src;
    img.alt = logo.alt;
    a.append(img);
    logoEl.append(a);
  }

  const linksEl = document.createElement('div');
  linksEl.className = 'nav-links';

  // Company 等第二nav
  const navSecond = document.createElement('div');
  navSecond.className = `nav-second h-grid-container ${isCompanyPage || isSupportPage ? '' : 'hidden'}`;
  const CompanyEl = document.createElement('div');
  CompanyEl.className = 'route-company';
  CompanyEl.textContent = 'Company';
  const CompanyGroupEl = document.createElement('div');
  CompanyGroupEl.className = 'company-group';
  company.forEach((item) => {
    const CompanyItemEl = document.createElement('div');
    const isCurrent = window.location.pathname.includes(item.href);
    CompanyItemEl.className = `company-item ${isCurrent ? 'current' : ''}`;
    CompanyItemEl.innerHTML = item.title;
    CompanyItemEl.dataset.href = item.href;
    CompanyItemEl.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = item.href;
    });
    CompanyGroupEl.append(CompanyItemEl);
  });

  const companyArrow = document.createElement('img');
  companyArrow.className = 'company-arrow';
  companyArrow.src = `/content/dam/hisense/${country}/common-icons/chevron-down-black.svg`;
  companyArrow.addEventListener('click', () => {
    if (navigation.classList.contains('show-second-menu-company')) {
      document.body.style.overflow = 'auto';
      navigation.classList.toggle('show-second-menu-company');
    } else {
      document.body.style.overflow = 'hidden';
      navigation.classList.toggle('show-second-menu-company');
    }
  });

  if (isCompanyPage) {
    navSecond.append(CompanyEl, CompanyGroupEl, companyArrow);
  }

  const SupportEl = document.createElement('div');
  SupportEl.className = 'route-support';
  SupportEl.textContent = 'Support';

  const supportArrow = document.createElement('img');
  supportArrow.className = 'support-arrow';
  supportArrow.src = `/content/dam/hisense/${country}/common-icons/chevron-down-black.svg`;
  supportArrow.addEventListener('click', () => {
    if (navigation.classList.contains('show-second-menu-support')) {
      document.body.style.overflow = 'auto';
      navigation.classList.toggle('show-second-menu-support');
    } else {
      document.body.style.overflow = 'hidden';
      navigation.classList.toggle('show-second-menu-support');
    }
  });
  if (isSupportPage) {
    navSecond.append(SupportEl, supportArrow);
  }

  // 悬浮展开
  const mobileMenu = document.createElement('div');
  mobileMenu.className = 'mobile-menu';
  const mobileLinks = document.createElement('div');
  mobileLinks.className = 'mobile-links';
  const mobileActions = document.createElement('div');
  mobileActions.className = 'mobile-actions';

  navItems.forEach((item, idx) => {
    const link = document.createElement('div');
    link.className = 'nav-link';
    const span1 = document.createElement('span');
    const span2 = document.createElement('span');
    span1.textContent = item.title;
    span2.textContent = item.title;
    span1.className = 'absolute';
    span2.className = 'transparent-bold';
    link.append(span1, span2);
    if (item.href && item.href !== '#') {
      link.dataset.href = item.href;
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = item.href;
      });
    }
    const dropdownData = dropdowns[idx];
    if (dropdownData
      && (dropdownData.products.length || dropdownData.links.length || dropdownData.btns.length)) {
      const mask = document.createElement('div');
      mask.className = 'nav-mask';
      mask.id = 'nav-mask';
      const dropdown = buildDropdown(dropdownData);
      link.append(mask);
      if (dropdown) {
        link.append(dropdown);
      }
    }
    linksEl.append(link);

    const mobileLink = document.createElement('div');
    mobileLink.className = 'mobile-link hide';
    const mobileLinkTitle = document.createElement('span');
    mobileLinkTitle.textContent = item.title;
    const arrow = document.createElement('img');
    arrow.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
    arrow.addEventListener('click', (e) => {
      e.stopPropagation();
      const mobileLinksEl = e.target.closest('.mobile-links');
      if (!mobileLinksEl) { return; }
      const shouldShow = e.target.closest('.mobile-link').classList.contains('hide');
      mobileLinksEl.querySelectorAll('.mobile-link').forEach((el) => {
        el.classList.add('hide');
      });
      if (shouldShow) {
        e.target.closest('.mobile-link').classList.remove('hide');
      }
    });
    // 这个是手机端二级菜单的title，相当于pc的nav的item
    const mobileLinkTitleLine = document.createElement('div');
    mobileLinkTitleLine.className = 'mobile-link-title-line';
    mobileLinkTitleLine.append(mobileLinkTitle, arrow);

    // 这个是手机端二级菜单的title展开的内容，相当于pc的nav的二级菜单的图片区的titlegroup
    const mobileSecondLinkList = document.createElement('div');
    mobileSecondLinkList.className = 'mobile-link-second-list';
    if (dropdownData?.products?.length) {
      dropdownData.products.forEach((p) => {
        const mobileProduct = document.createElement('div');
        mobileProduct.className = 'mobile-product-item';
        mobileProduct.textContent = p.text;
        mobileProduct.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = p.href;
        });
        mobileSecondLinkList.append(mobileProduct);
      });
    }

    mobileLink.append(mobileLinkTitleLine, mobileSecondLinkList);
    if (item.href && item.href !== '#') {
      mobileLink.dataset.href = item.href;
      mobileLink.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = item.href;
      });
    }
    mobileLinks.append(mobileLink);
  });

  const actionsEl = document.createElement('div');
  actionsEl.className = 'nav-actions';
  navLinks.forEach((action) => {
    const link = document.createElement('div');
    link.className = 'nav-section';
    const span1 = document.createElement('span');
    span1.textContent = action.title;
    link.append(span1);
    const cloneLink = link.cloneNode(true);
    const mobileCloneLink = link.cloneNode(true);
    if (action.href && action.href !== '#') {
      cloneLink.dataset.href = action.href;
      cloneLink.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = action.href;
      });
      mobileCloneLink.dataset.href = action.href;
      mobileCloneLink.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = action.href;
      });
    }
    if (action.title.trim().toLowerCase() === 'support') {
      cloneLink.classList.add('nav-link');
      const mask = document.createElement('div');
      mask.className = 'nav-mask';
      mask.id = 'nav-mask';
      const dropdownEl = buildSupportDropdown(fragment);
      cloneLink.append(mask);
      if (dropdownEl) {
        cloneLink.append(dropdownEl);
      }
    }
    actionsEl.append(cloneLink);
    mobileActions.append(mobileCloneLink);
  });
  actions.forEach((action) => {
    if (action.img) {
      const btn = document.createElement('div');
      btn.className = 'nav-action-btn';
      const img = document.createElement('img');
      img.src = action.img;
      img.className = 'light-img';
      img.alt = action.title || 'action';
      btn.append(img);
      const imgDark = document.createElement('img');
      // imgDark.src = convertToDarkSvgUrl(action.img);
      imgDark.src = action.darkImg || action.img;
      imgDark.alt = action.title || 'action';
      imgDark.className = 'dark-img';
      btn.append(imgDark);
      if (action.enableSearchBox) {
        btn.addEventListener('click', toggleSearchBoxPopup);
        btn.addEventListener('mouseenter', checkSearchBoxPopup);
        btn.addEventListener('mouseleave', hideSearchBoxPopup);
      } else {
        btn.dataset.loading = 'false';
        btn.addEventListener('click', handleAccountActionClick);
      }

      // TODO: 是否为购物车，购物车的数量
      const countSpan = document.createElement('span');
      countSpan.className = 'count-span';
      countSpan.textContent = '3';
      btn.append(countSpan);

      // TODO: 是否为person
      const personEl = document.createElement('div');
      personEl.className = 'person-drawer';
      const userEl = document.createElement('div');
      userEl.className = 'user-group';
      const portrait = document.createElement('img');
      portrait.className = 'portrait';
      portrait.src = 'https://picsum.photos/40/40?random=1';
      const nameEl = document.createElement('div');
      nameEl.className = 'person-name';
      nameEl.textContent = 'John';
      userEl.append(portrait, nameEl);

      const myItems = document.createElement('div');
      myItems.className = 'my-items-group';

      const myProducts = document.createElement('div');
      myProducts.className = 'my-item';
      const myProductsSpan = document.createElement('span');
      myProductsSpan.className = 'my-product-title';
      myProductsSpan.textContent = 'My Products';
      const myProductsCountSpan = document.createElement('span');
      myProductsCountSpan.className = 'my-count-span';
      myProductsCountSpan.textContent = '3';
      myProducts.append(myProductsSpan, myProductsCountSpan);
      myItems.append(myProducts.cloneNode(true), myProducts.cloneNode(true), myProducts.cloneNode(true), myProducts.cloneNode(true), myProducts.cloneNode(true));
      const logoutEl = document.createElement('div');
      logoutEl.className = 'logout-group';
      logoutEl.textContent = 'log out';
      logoutEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const mask = document.querySelector('#logout-mask');
        mask.style.display = 'block';
        const popup = document.querySelector('#logout-popup');
        popup.style.display = 'block';
      });

      const divisionLine = document.createElement('div');
      divisionLine.className = 'division-line';

      personEl.append(userEl, divisionLine.cloneNode(true), myItems, divisionLine.cloneNode(true), logoutEl);
      btn.append(personEl);

      actionsEl.append(btn);
      return;
    }
    const link = document.createElement('div');
    link.className = 'nav-link';
    link.textContent = action.title;
    if (action.href && action.href !== '#') {
      link.dataset.href = action.href;
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = action.href;
      });
    }
    actionsEl.append(link);
  });

  // 物理添加手机端菜单按钮
  const btn = document.createElement('div');
  btn.className = 'nav-action-btn mobile-menu-icon';
  const img = document.createElement('img');
  img.src = `/content/dam/hisense/${country}/header/menu.svg`;
  img.className = 'light-img';
  img.alt = 'menu';
  btn.append(img);
  const imgDark = document.createElement('img');
  imgDark.src = `/content/dam/hisense/${country}/header/menu-dark.svg`;
  imgDark.alt = 'menu';
  imgDark.className = 'dark-img';
  btn.append(imgDark);
  btn.addEventListener('click', () => {
    document.body.style.overflow = 'hidden';
    navigation.classList.add('show-menu');
  });
  actionsEl.append(btn);

  const closeBtn = document.createElement('div');
  closeBtn.className = 'nav-action-btn mobile-close-icon';
  const closeImg = document.createElement('img');
  closeImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
  closeImg.alt = 'menu';
  closeBtn.addEventListener('click', () => {
    document.body.style.overflow = 'auto';
    navigation.classList.remove('show-menu');
  });
  closeBtn.append(closeImg);
  actionsEl.append(closeBtn);

  navContainer.append(logoEl, linksEl, actionsEl);

  const dividingLine = document.createElement('div');
  dividingLine.className = 'dividing-line';

  mobileMenu.append(mobileLinks);
  mobileMenu.append(dividingLine);
  mobileMenu.append(mobileActions);

  // 悬浮展开二级菜单 company
  const mobileSecondMenu = document.createElement('div');
  mobileSecondMenu.className = 'mobile-second-menu company';
  if (!isCompanyPage) {
    mobileSecondMenu.style.display = 'none';
  }

  company.forEach((item) => {
    const mobileSecondMenuItem = document.createElement('div');
    const isCurrent = window.location.pathname.includes(item.href);
    mobileSecondMenuItem.className = `mobile-second-menu-item ${isCurrent ? 'current' : ''}`;
    mobileSecondMenuItem.innerHTML = item.title;
    mobileSecondMenuItem.dataset.href = item.href;
    mobileSecondMenuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = item.href;
    });
    mobileSecondMenu.append(mobileSecondMenuItem);
  });

  // 悬浮展开二级菜单 support
  const mobileSecondMenuSupport = document.createElement('div');
  mobileSecondMenuSupport.className = 'mobile-second-menu support';
  if (!isSupportPage) {
    mobileSecondMenuSupport.style.display = 'none';
  }

  const supportEl = fragment.querySelector('.support-navigation-route-container');
  if (supportEl) {
    const supportRouteBaseList = supportEl.querySelector('.support-navigation-route-wrapper .support-navigation-route');
    const support = [...supportRouteBaseList.children].map((item) => {
      const title = item.children[0]?.textContent?.trim() || '';
      const href = item.children[1]?.textContent?.trim() || '#';
      return { href, title };
    });

    support.forEach((item) => {
      const mobileSecondMenuSupportItem = document.createElement('div');
      const isCurrent = window.location.pathname.includes(item.href);
      mobileSecondMenuSupportItem.className = `mobile-second-menu-item ${isCurrent ? 'current' : ''}`;
      mobileSecondMenuSupportItem.innerHTML = item.title;
      mobileSecondMenuSupportItem.dataset.href = item.href;
      mobileSecondMenuSupportItem.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = item.href;
      });
      mobileSecondMenuSupport.append(mobileSecondMenuSupportItem);
    });
    mobileSecondMenuSupport.append(dividingLine.cloneNode(true));

    // support product list
    const supportProductBaseList = supportEl.querySelectorAll('.support-navigation-products-links-wrapper .support-navigation-products-links');
    supportProductBaseList.forEach((proGroup) => {
      const supportProductEl = document.createElement('div');
      supportProductEl.className = 'support-product mobile-link hide';

      [...proGroup.children].forEach((item, index) => {
        if (index) {
          const hasGroup = supportProductEl.querySelector('.mobile-link-second-list') !== null;
          if (!hasGroup) {
            const orderGroup = document.createElement('div');
            orderGroup.className = 'mobile-link-second-list';
            supportProductEl.append(orderGroup);
          }
          const supportProductItemEl = supportProductEl.querySelector('.mobile-link-second-list');
          const link = document.createElement('div');
          link.className = 'mobile-product-item';
          const { title, href } = getSupportSubMenuLinkData(item);
          const span1 = document.createElement('span');
          span1.textContent = title;
          link.append(span1);
          if (href && href !== '#') {
            link.dataset.href = href;
            link.addEventListener('click', (e) => {
              e.stopPropagation();
              window.location.href = href;
            });
          }
          supportProductItemEl.append(link);
        } else {
          const mobileLinkTitle = document.createElement('span');
          mobileLinkTitle.textContent = item.textContent?.trim();
          const arrow = document.createElement('img');
          arrow.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
          arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const mobileLinksEl = e.target.closest('.mobile-second-menu');
            if (!mobileLinksEl) {
              return;
            }
            const shouldShow = e.target.closest('.mobile-link').classList.contains('hide');
            mobileLinksEl.querySelectorAll('.mobile-link').forEach((el) => {
              el.classList.add('hide');
            });
            if (shouldShow) {
              e.target.closest('.mobile-link').classList.remove('hide');
            }
          });
          const mobileLinkTitleLine = document.createElement('div');
          mobileLinkTitleLine.className = 'mobile-link-title-line';
          mobileLinkTitleLine.append(mobileLinkTitle, arrow);
          supportProductEl.append(mobileLinkTitleLine);
        }
      });
      mobileSecondMenuSupport.append(supportProductEl, dividingLine.cloneNode(true));
    });

    // support contact us list
    const contactUsEl = document.createElement('div');
    contactUsEl.className = 'contact-us-links';
    const supportMenuLinksList = supportEl.querySelector('.support-navigation-menu-links-wrapper .support-navigation-menu-links');
    if (supportMenuLinksList) {
      [...supportMenuLinksList.children].forEach((item) => {
        const { title, href } = getSupportSubMenuLinkData(item);
        const div = document.createElement('div');
        div.className = 'mobile-product-item';
        if (href && href !== '#') {
          const a = document.createElement('a');
          a.href = href;
          a.textContent = title;
          div.append(a);
        } else {
          div.textContent = title;
        }
        contactUsEl.append(div);
      });
    }
    mobileSecondMenuSupport.append(contactUsEl);
  }
  // 展开SearchBox
  const searchBoxEl = buildSearchBoxPopup(fragment);
  // navigation.append(searchBoxPopEl);
  const searchBoxPopupEl = document.createElement('div');
  if (searchBoxEl) {
    searchBoxPopupEl.className = 'search-box-popup';
    searchBoxPopupEl.appendChild(searchBoxEl);
  }

  navigation.append(navContainer);
  navigation.append(navSecond);
  navigation.append(mobileMenu);
  navigation.append(mobileSecondMenu);
  navigation.append(mobileSecondMenuSupport);
  if (searchBoxEl) {
    navigation.append(searchBoxPopupEl);
  }
  const shadow = document.createElement('div');
  shadow.className = 'shadow';
  navigation.append(shadow);
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop >= 10) {
      navigation.classList.add('scroll-active');
    } else {
      navigation.classList.remove('scroll-active');
      if (navigation.classList.contains('hidden')) {
        navigation.classList.remove('hidden');
      }
    }
  });
  const carousel = document.querySelector('.carousel');
  const hasDarkClass = carousel?.classList.contains('dark');
  if (hasDarkClass) {
    navigation.classList.add('header-dark-mode');
  }

  block.textContent = '';
  block.append(navigation);

  const popup = document.createElement('div');
  popup.id = 'logout-popup';
  const popupCloseImg = document.createElement('img');
  popupCloseImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
  popupCloseImg.className = 'close-icon';
  
  const logoutContext = document.createElement('div');
  logoutContext.className = 'logout-context';
  const logoutContextTitle = document.createElement('div');
  logoutContextTitle.className = 'title';
  logoutContextTitle.textContent = 'Are you sure you want to log out?';
  const logoutContextSubtitle = document.createElement('div');
  logoutContextSubtitle.className = 'subtitle';
  logoutContextSubtitle.textContent = 'You\'ll need to sign in again to access your account, registered products, and orders.';
  logoutContext.append(logoutContextTitle, logoutContextSubtitle);

  const logoutBtnGroup = document.createElement('div');
  logoutBtnGroup.className = 'logout-btn-group';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    const mask = document.querySelector('#logout-mask');
    mask.style.display = '';
    const cancelBtnPopup = document.querySelector('#logout-popup');
    cancelBtnPopup.style.display = '';
  });
  const sureBtn = document.createElement('button');
  sureBtn.className = 'sure-btn';
  sureBtn.textContent = 'Log out';
  sureBtn.addEventListener('click', () => {
    console.log('logout');
  });
  logoutBtnGroup.append(cancelBtn, sureBtn);

  popup.append(popupCloseImg, logoutContext, logoutBtnGroup);
  
  const mask = document.createElement('div');
  mask.id = 'logout-mask';
  const body = document.querySelector('body');
  body.append(popup, mask);
}
