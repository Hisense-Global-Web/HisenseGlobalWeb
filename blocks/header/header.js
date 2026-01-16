import { loadFragment } from '../fragment/fragment.js';

function parseLogo(root) {
  const logoImg = root.querySelector('.navigation-logo-wrapper img');
  const logoHref = root.querySelector('.navigation-logo-wrapper a')?.href || '/';
  return {
    src: logoImg?.src || '',
    href: logoHref,
    alt: logoImg?.alt || 'logo',
  };
}

function parseNavItems(root) {
  return Array.from(root.querySelectorAll('.navigation-item-wrapper')).map((wrapper) => {
    const pList = wrapper.querySelectorAll('p');
    const title = pList[1]?.textContent?.trim() || '';
    const href = pList[0]?.textContent?.trim() || '#';
    return { title, href };
  });
}
function parseNavLinks(root) {
  return Array.from(root.querySelectorAll('.navigation-link-wrapper')).map((wrapper) => {
    const title = wrapper.querySelector('p:not(.button-container)')?.textContent?.trim() || '';
    const href = wrapper.querySelector('a')?.href || '#';
    return { title, href };
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
    return {
      title, href, img, darkImg,
    };
  });
}

function parseDropdownProducts(col) {
  if (!col) return [];

  const imageLinkItems = Array.from(col.querySelectorAll('.image-link'));

  if (imageLinkItems.length) {
    return imageLinkItems.map((item) => {
      const img = item.querySelector('img')?.src || '';
      let href = item.querySelector('a')?.href || '#';
      const directChildren = Array.from(item.children);
      let text = '';
      let altText = '';
      if (directChildren[1]) {
        altText = directChildren[1].textContent.trim();
      }
      if (directChildren[2]) {
        text = directChildren[2].textContent.trim();
      } else {
        text = item.textContent.trim();
      }

      // 检查是否有第4个元素作为标签配置
      if (directChildren[3] && directChildren[3].textContent.trim()) {
        const tagsText = directChildren[3].textContent.trim();
        const tagParams = tagsText.split(',')
          .map((tag) => {
            // 取最后两节并替换 / 为 =, type/xxxx = type=xxxx 链接参数
            const parts = tag.trim().split('/');
            if (parts.length >= 2) {
              const key = parts[parts.length - 2];
              const value = parts[parts.length - 1];
              return `${key}=${value}`;
            }
            return '';
          })
          .filter((param) => param)
          .join('&');

        if (href !== '#' && tagParams) {
          const separator = href.includes('?') ? '&' : '?';
          href = `${href}${separator}${tagParams}`;
        }
      }

      return {
        img, text, href, altText,
      };
    });
  }

  const products = [];
  const children = Array.from(col.children);

  // 找到所有的picture元素作为分组标识
  const pictures = children.filter((child) => child.tagName === 'P' && child.querySelector('picture'));
  const pictureIndices = pictures.map((pic) => children.indexOf(pic));

  // 为每个分组创建数据
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

    // 检查是否有第5个元素作为标签配置
    if (groupElements[4] && groupElements[4].textContent.trim()) {
      const tagsText = groupElements[4].textContent.trim();
      const tagParams = tagsText.split(',')
        .map((tag) => {
          // 取最后两节并替换 / 为 = type/xxxx = type=xxxx 链接参数
          const parts = tag.trim().split('/');
          if (parts.length >= 2) {
            const key = parts[parts.length - 2];
            const value = parts[parts.length - 1];
            return `${key}=${value}`;
          }
          return '';
        })
        .filter((param) => param)
        .join('&');

      // 如果有基础链接且有标签参数，则添加查询参数
      if (href !== '#' && tagParams) {
        const separator = href.includes('?') ? '&' : '?';
        href = `${href}${separator}${tagParams}`;
      }
    }

    products.push({
      img, text, href, altText,
    });
  }
  return products;
}

function parseDropdownLinks(col) {
  if (!col) return [];
  const imageLinkItems = Array.from(col.querySelectorAll('.image-link'));

  if (imageLinkItems.length) {
    return imageLinkItems.map((item) => {
      const textElement = item.querySelector('div:nth-child(3) > div');
      const text = textElement ? textElement.textContent.trim() : '';

      const linkElement = item.querySelector('.button-container a.button');
      const href = linkElement ? linkElement.getAttribute('href') : '';

      return {
        text,
        href,
      };
    }).filter((item) => item.text);
  }

  const results = [];
  const items = Array.from(col.querySelectorAll('p'));
  for (let i = 0; i < items.length; i += 2) {
    const text = items[i]?.textContent.trim();
    const href = items[i + 1]?.textContent.trim() || '#';
    results.push({ text, href });
  }
  return results;
}

function parseDropdownBtns(col) {
  if (!col) return [];

  const results = [];

  const imageLinks = col.querySelectorAll('.image-link');
  if (imageLinks.length > 0) {
    imageLinks.forEach((imageLink) => {
      const altText = imageLink.children[1]?.textContent.trim() ?? '';
      const text = imageLink.children[2]?.textContent.trim() ?? '';
      const linkElement = imageLink.querySelector('a');
      const href = linkElement ? linkElement.getAttribute('href') : '';

      if (text) {
        results.push({ text, href: href || '#', altText });
      }
    });
    return results;
  }

  const paragraphs = Array.from(col.querySelectorAll('p'));
  for (let i = 0; i < paragraphs.length; i += 2) {
    const text = paragraphs[i]?.textContent.trim();
    const href = paragraphs[i + 1]?.textContent.trim() || '#';
    results.push({ text, href });
  }

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
    if (link.href && link.href !== '#') {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      div.append(a);
    } else {
      div.textContent = link.text;
    }
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

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navPath = `${window.hlx.codeBasePath}${window.location.href.includes('hisense.com') ? '/us/nav' : '/us/en/nav'}`;
  const fragment = await loadFragment(navPath);

  // 解析原始DOM
  const logo = parseLogo(fragment);
  const navItems = parseNavItems(fragment);
  const navLinks = parseNavLinks(fragment);
  const actions = parseActions(fragment);
  const dropdowns = parseDropdowns(fragment);

  // 构建新的导航DOM
  const navigation = document.createElement('div');
  navigation.id = 'navigation';
  let lastScrollTop = 0;
  const scrollThreshold = 10;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
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
    const a = document.createElement('a');
    a.href = logo.href;
    const img = document.createElement('img');
    img.src = logo.src;
    img.alt = logo.alt;
    a.append(img);
    logoEl.append(a);
  }

  const linksEl = document.createElement('div');
  linksEl.className = 'nav-links';

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
      link.append(mask, dropdown);
    }
    linksEl.append(link);

    const mobileLink = document.createElement('div');
    mobileLink.className = 'mobile-link hide';
    const mobileLinkTitle = document.createElement('span');
    mobileLinkTitle.textContent = item.title;
    const arrow = document.createElement('img');
    arrow.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
    arrow.addEventListener('click', (e) => {
      e.stopPropagation();
      const grandParent = e.target.parentNode?.parentNode;
      if (!grandParent) { return; }
      grandParent.classList.toggle('hide');
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
    link.textContent = action.title;
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
      if (action.href && action.href !== '#') {
        btn.dataset.href = action.href;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = action.href;
        });
      }
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
  img.src = '/content/dam/hisense/us/header/menu.svg';
  img.className = 'light-img';
  img.alt = 'menu';
  btn.append(img);
  const imgDark = document.createElement('img');
  imgDark.src = '/content/dam/hisense/us/header/menu-dark.svg';
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
  closeImg.src = '/content/dam/hisense/us/common-icons/close.svg';
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

  navigation.append(navContainer);
  navigation.append(mobileMenu);
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop >= 10) {
      navigation.classList.add('scroll-active');
    } else {
      navigation.classList.remove('scroll-active');
    }
  });
  const carousel = document.querySelector('.carousel');
  const hasDarkClass = carousel?.classList.contains('dark');
  if (hasDarkClass) {
    navigation.classList.add('header-dark-mode');
  }

  block.textContent = '';
  block.append(navigation);
}
