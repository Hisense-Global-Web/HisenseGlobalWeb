import { getFragmentPath, getLocaleFromPath } from './locale-utils.js';

const sourceSuffix = '.plain.html';

const constants = {
  cookieSource: 'config/cookie',
  cookieClassName: 'cookie',
  dataManagementSource: 'config/data-management',
  dataManagementClassName: 'data-management',
};

const formParams = {
  placeholder: {
    lang: '#lang#',
    ProductCategory: '#ProductCategory#',
    InternalModelNumber: '#InternalModelNumber#',
    SerialNumber: '#SerialNumber#',
    DSN: '#DSN#',
  },
};

function upsertHeadMeta(name, content) {
  if (!name || !content) {
    return;
  }

  let meta = document.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

function applyPriceSpiderMetaTags() {
  const { country, language } = getLocaleFromPath();
  upsertHeadMeta('ps-key', '6998-659da0480715a3000dcb7a24');
  upsertHeadMeta('ps-country', country);
  upsertHeadMeta('ps-language', language);
}

function isExternalJs(url) {
  try {
    const parsedUrl = new URL(url);
    const { pathname, search } = parsedUrl;

    return {
      isJsPath: pathname.endsWith('.js'),
      hasParams: search !== '',
    };
  } catch (error) {
    // Invalid URL
    return {
      isJsPath: false,
      hasParams: false,
    };
  }
}

function isIframeDiv(text) {
  return /^<div[\s\S]*?>[\s\S]*?<iframe[\s\S]*?>[\s\S]*?<\/iframe>[\s\S]*?<\/div>$/i.test(text.trim())
    || /^<noscript[\s\S]*?>[\s\S]*?<iframe[\s\S]*?>[\s\S]*?<\/iframe>[\s\S]*?<\/noscript>$/i.test(text.trim());
}

function isInlineScript(text) {
  return /^<script[\s\S]*?>[\s\S]*?<\/script>$/.test(text.trim());
}

function injectInlineScript(scriptTag) {
  const injectedInlineScripts = new Set();
  const normalizedScript = scriptTag.trim();
  if (!normalizedScript || injectedInlineScripts.has(normalizedScript)) {
    return;
  }

  const temp = document.createElement('div');
  temp.innerHTML = normalizedScript;
  const script = temp.querySelector('script');
  if (script) {
    const newScript = document.createElement('script');
    if (script.src) {
      newScript.src = script.src;
    } else {
      newScript.textContent = script.textContent;
    }
    document.head.appendChild(newScript);
    injectedInlineScripts.add(normalizedScript);
  }
}

function fillIframePlaceholders(iframeEle, language) {
  const { lang, ...searchPlaceholders } = formParams.placeholder;
  const iframeMarkup = iframeEle.trim().replaceAll(lang, language);
  const searchParams = window.location.search ? new URLSearchParams(window.location.search) : null;

  return Object.entries(searchPlaceholders).reduce(
    (content, [key, placeholder]) => content.replaceAll(placeholder, encodeURIComponent(searchParams?.get(key) ?? '')),
    iframeMarkup,
  );
}

function stripEmptyQueryParams(url) {
  if (!url || !url.includes('?')) {
    return url;
  }

  const [pathWithQuery, hash = ''] = url.split('#');
  const [path, query = ''] = pathWithQuery.split('?');
  const searchParams = new URLSearchParams(query);
  const cleanedSearchParams = new URLSearchParams();

  searchParams.forEach((value, key) => {
    if (value) {
      cleanedSearchParams.append(key, value);
    }
  });

  const cleanedQuery = cleanedSearchParams.toString();
  const hashFragment = hash ? `#${hash}` : '';

  return cleanedQuery ? `${path}?${cleanedQuery}${hashFragment}` : `${path}${hashFragment}`;
}

function sanitizeIframeSrcParams(container) {
  container.querySelectorAll('iframe[src]').forEach((iframe) => {
    const src = iframe.getAttribute('src');

    iframe.setAttribute('src', stripEmptyQueryParams(src));
  });
}

async function injectExternalScript(source, blockName) {
  const fragmentPath = getFragmentPath(source);
  try {
    const resp = await fetch(`${fragmentPath}${sourceSuffix}`);

    if (!resp.ok) {
      // eslint-disable-next-line no-console
      console.debug(`Source page (${fragmentPath}) is not found.`);
      return;
    }

    const dom = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const div = dom.querySelector(`.${blockName}`)?.querySelectorAll(':scope > div');
    const externalScripts = [div[0]?.textContent, div[1]?.textContent, div[2]?.textContent].filter(Boolean);

    const iframeEle = [];
    externalScripts.forEach((script) => {
      if (script && isInlineScript(script)) {
        injectInlineScript(script);
      }

      if (script && isIframeDiv(script)) {
        const iframeItem = document.createElement('div');
        iframeItem.innerHTML += script;
        iframeEle.push(iframeItem.firstElementChild);
      }
    });

    if (iframeEle.length > 0) {
      document.body.appendChild(...iframeEle);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.debug(err);
  }
}

export {
  constants,
  upsertHeadMeta,
  applyPriceSpiderMetaTags,
  isExternalJs,
  isIframeDiv,
  isInlineScript,
  injectInlineScript,
  sanitizeIframeSrcParams,
  fillIframePlaceholders,
  injectExternalScript,
};
