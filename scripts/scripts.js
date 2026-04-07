import getDynamicHeaderHeight from '../utils/dynamic-computed-header-height.js';
import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import { getEdsBaseUrl, getGraphQLBaseUrl } from './environment.js';
import {
  consumeHybrisLogoutAction,
  getHybrisBffBaseUrl,
  initializeHybrisAuth,
  scheduleHybrisTask,
} from './hybris-bff.js';
import { isUniversalEditor } from '../utils/ue-helper.js';
import {
  getFragmentPath,
  isConfigPage,
  isFooterPage,
  isNavPage,
  getLocaleFromPath
} from './locale-utils.js';

export { getEdsBaseUrl, getGraphQLBaseUrl } from './environment.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  if (window.location.hostname.includes('hisense.com') && window.location.pathname.includes('/us')) {
    const links = main.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/us/en')) {
        link.setAttribute('href', href.replace('/us/en', '/us'));
      }

      const { textContent } = link;
      if (textContent && textContent.startsWith('/us/en')) {
        link.textContent = textContent.replace('/us/en', '/us');
      }
    });
  }

  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Set global variables for API endpoints
 */
function setGlobalApiVariables() {
  const gqlBaseUrl = getGraphQLBaseUrl();
  window.GRAPHQL_BASE_URL = gqlBaseUrl;
  window.EDS_BASE_URL = getEdsBaseUrl();
  window.HYBRIS_BFF_BASE_URL = getHybrisBffBaseUrl();
}

async function loadRemoteErrorPage(main) {
  if (!window.isErrorPage || !main) {
    return false;
  }

  const errorCode = window.errorCode || '404';
  const errorPath = getFragmentPath(`exception/${errorCode}`);

  try {
    const resp = await fetch(`${errorPath}.plain.html`);
    if (!resp.ok) {
      return false;
    }

    const fragmentMain = document.createElement('main');
    fragmentMain.innerHTML = await resp.text();

    const resetAttributeBase = (tag, attr) => {
      fragmentMain.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
        elem[attr] = new URL(elem.getAttribute(attr), new URL(errorPath, window.location)).href;
      });
    };

    resetAttributeBase('img', 'src');
    resetAttributeBase('source', 'srcset');

    decorateMain(fragmentMain);
    await loadSections(fragmentMain);

    const fragmentSections = [...fragmentMain.children];
    const hasExceptionPage = fragmentMain.querySelector('.exception-page');

    if (!hasExceptionPage || !fragmentSections.length) {
      return false;
    }

    main.replaceChildren(...fragmentSections);
    main.classList.remove('error');
    // handle not found exception-page block
    const exceptionPageBlock = main.querySelector('.exception-page');
    getDynamicHeaderHeight(exceptionPageBlock);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug(`failed to load remote error page from ${errorPath}`, error);
    return false;
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  // Set global API variables first
  setGlobalApiVariables();
  consumeHybrisLogoutAction();
  scheduleHybrisTask(() => initializeHybrisAuth()).catch((error) => {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize Hybris auth', error);
  });

  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    if (isConfigPage() || isFooterPage()) {
      // to nothing
    } else {
      loadHeader(doc.querySelector('header'));
    }
    const hasRemoteErrorPage = await loadRemoteErrorPage(main);
    if (!hasRemoteErrorPage) {
      decorateMain(main);
    }
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  if (isConfigPage() || isNavPage()) {
    // to nothing
  } else {
    loadFooter(doc.querySelector('footer'));
  }

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

function loadDelayedImages() {
  const currentHostname = window.location.hostname;

  if (currentHostname.includes('hisense-stage') || currentHostname.includes('hisense-dev') || currentHostname.includes('localhost')) {
    const domainPrefix = currentHostname.includes('hisense-stage')
      ? 'https://publish-p174152-e1855674.adobeaemcloud.com'
      : 'https://publish-p174152-e1855821.adobeaemcloud.com';

    const processImage = (img) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('/content/dam')) {
        if (!src.startsWith(domainPrefix)) {
          img.setAttribute('src', domainPrefix + src);
        }
      }
    };

    const addImageLoadListener = (img) => {
      if (img.hasAttribute('data-processed')) return;

      img.addEventListener('error', () => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/content/dam') && !src.startsWith(domainPrefix)) {
          img.setAttribute('src', domainPrefix + src);
        }
      });

      img.addEventListener('load', () => {
        processImage(img);
        img.setAttribute('data-processed', 'true');
      });

      if (img.complete) {
        processImage(img);
        img.setAttribute('data-processed', 'true');
      }
    };

    document.querySelectorAll('img').forEach(addImageLoadListener);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'img') {
            addImageLoadListener(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const images = node.querySelectorAll('img');
            images.forEach(addImageLoadListener);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  loadDelayedImages();
}

function updateUSLinks() {
  const currentUrl = window.location.href;
  const isUSSite = currentUrl.includes('hisense.com/us');

  if (isUSSite) {
    const links = document.querySelectorAll('a[href]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/us/en')) {
        const newHref = href.replace(/^\/us\/en/, '/us');
        link.setAttribute('href', newHref);
      }
    });
  }
}

function transHorizontalSection(className) {
  const bElements = document.querySelectorAll(className);

  if (bElements.length > 0) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('horizontal-section');
    bElements.forEach((el) => {
      wrapper.appendChild(el.cloneNode(true));
    });

    // 用 wrapper 替换所有 .b 元素
    bElements[0].replaceWith(wrapper);

    // 删除剩余的 .b 元素
    for (let i = 1; i < bElements.length; i += 1) {
      bElements[i].remove();
    }
  }
}

async function loadAnnouncementPopup() {
  if (isUniversalEditor()) {
    return false;
  }

  const { country } = getLocaleFromPath();
  const announcementActiveCountries = ['mx'];

  if (!announcementActiveCountries.includes(country)) {
    return false;
  }

  const popupUrl = getFragmentPath('config/announcement');
  try {
    const resp = await fetch(`${popupUrl}.plain.html`);

    if (!resp.ok) {
      return false;
    }

    const fragmentMain = document.createElement('main');
    fragmentMain.innerHTML = await resp.text();

    const resetAttributeBase = (tag, attr) => {
      fragmentMain.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
        elem[attr] = new URL(elem.getAttribute(attr), new URL(popupUrl, window.location)).href;
      });
    };

    resetAttributeBase('img', 'src');
    resetAttributeBase('source', 'srcset');

    decorateMain(fragmentMain);
    await loadSections(fragmentMain);

    const fragmentSections = [...fragmentMain.children];
    const anncEl = fragmentMain.querySelector('.popup-announcement');

    if (!anncEl || !fragmentSections.length) {
      return false;
    }

    if (document.querySelector('.popup-announcement')) {
      // check version of the existing announcement popup, if it's different from the new one, replace it with the new one, otherwise keep the existing one to avoid showing the same announcement popup repeatedly when user close it
      const prevAnnc = document.querySelector('.popup-announcement');
      const existingVersion = prevAnnc.getAttribute('data-version') || '';
      const newVersion = anncEl.getAttribute('data-version') || '';
      if (existingVersion !== newVersion) {
        prevAnnc.replaceWith(anncEl);
      }
    } else {
      document.querySelector('main').appendChild(...fragmentSections);
    }

    const currentAnnc = document.querySelector('.popup-announcement');
    // check local storage to decide whether show the announcement popup, only show it when the version is different from the version user closed last time
    const announcementVersion = currentAnnc.getAttribute('data-version') || '';
    const closedVersion = localStorage.getItem('announcementClosedVersion') || '';
    if (announcementVersion && announcementVersion !== closedVersion) {
      currentAnnc.classList.add('popup-show');
      document.body.style.overflow = 'hidden';
    } else {
      currentAnnc.classList.remove('popup-show');
      document.body.style.overflow = 'auto';
    }

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug(`failed to load remote error page from ${popupUrl}`, error);
    return false;
  }
}

function storeInformationSelect() {
  const el = document.querySelectorAll('.store-information-card-container');
  const selectDiv = document.createElement('div');
  // 2. 创建第一个下拉框 id="selectTag"
  const selectTag = document.createElement('select');
  selectTag.id = 'selectTag';
  // 3. 创建第二个下拉框 id="selectItemTag"
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
async function loadPage() {
  loadAnnouncementPopup();
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
  transHorizontalSection('.honors-awards-wrapper');
  storeInformationSelect();

  // Update US site links after page load is complete
  if (document.readyState === 'complete') {
    updateUSLinks();
  } else {
    window.addEventListener('load', updateUSLinks);
  }
}

loadPage();
