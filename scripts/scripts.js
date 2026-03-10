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
import { getFragmentPath } from './locale-utils.js';

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
 * Get GraphQL API base URL based on current hostname
 */
export function getGraphQLBaseUrl() {
  const { hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'https://publish-p174152-e1855821.adobeaemcloud.com/';
  }

  // Author environment - use same origin
  if (hostname.includes('author-')) {
    return '';
  }

  // Publish environment - use same origin
  if (hostname.includes('publish-')) {
    return '';
  }

  // Dev environment
  if (hostname.includes('hisense-dev')) {
    return 'https://publish-p174152-e1855821.adobeaemcloud.com';
  }

  // Stage environment
  if (hostname.includes('hisense-stage')) {
    return 'https://publish-p174152-e1855674.adobeaemcloud.com';
  }

  // Production environment
  if (hostname.includes('hisense.com') || hostname.includes('hisenseglobalweb')) {
    return 'https://publish-p174152-e1855954.adobeaemcloud.com';
  }

  // Default fallback for localhost or unknown environments
  return '';
}

/**
 * Get EDS base URL based hostname
 */
function getEdsBaseUrl() {
  const { hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('e1855821')) {
    return 'https://development--hisense-dev--hisense-global-web.aem.page';
  }

  if (hostname.includes('e1855674')) {
    return 'https://stage--hisense-stage--hisense-global-web.aem.page';
  }

  if (hostname.includes('e1855954')) {
    return 'https://main--hisenseglobalweb--hisense-global-web.aem.live';
  }

  return window.location.origin;
}

/**
 * Set global variables for API endpoints
 */
function setGlobalApiVariables() {
  const gqlBaseUrl = getGraphQLBaseUrl();
  window.GRAPHQL_BASE_URL = gqlBaseUrl;
  window.EDS_BASE_URL = getEdsBaseUrl();
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

  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    loadHeader(doc.querySelector('header'));
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

  loadFooter(doc.querySelector('footer'));

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
async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
  transHorizontalSection('.honors-awards-wrapper');

  // Update US site links after page load is complete
  if (document.readyState === 'complete') {
    updateUSLinks();
  } else {
    window.addEventListener('load', updateUSLinks);
  }
}

loadPage();
