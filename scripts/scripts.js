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
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    loadHeader(doc.querySelector('header'));
    decorateMain(main);
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

  if (currentHostname.includes('hisensesitestage') || currentHostname.includes('hisensesitedev') || currentHostname.includes('localhost')) {
    const domainPrefix = 'https://publish-p174152-e1855821.adobeaemcloud.com';

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

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();

  // Update US site links after page load is complete
  if (document.readyState === 'complete') {
    updateUSLinks();
  } else {
    window.addEventListener('load', updateUSLinks);
  }
}

loadPage();
