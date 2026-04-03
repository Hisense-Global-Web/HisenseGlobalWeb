import { isUniversalEditorAsync } from '../../utils/ue-helper.js';
import { loadScript } from '../../scripts/aem.js';

const injectedInlineScripts = new Set();

// Functions
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

function isInlineScript(text) {
  return /^<script[\s\S]*?>[\s\S]*?<\/script>$/.test(text.trim());
}

function isIframeDiv(text) {
  return /^<div[\s\S]*?>[\s\S]*?<iframe[\s\S]*?>[\s\S]*?<\/iframe>[\s\S]*?<\/div>$/i.test(text.trim());
}

function injectInlineScript(scriptTag) {
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

function getPageLocale() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const baseIndex = segments[0] === 'content' ? 2 : 0;

  return {
    country: segments[baseIndex] || '',
    language: segments[baseIndex + 1] || 'en',
  };
}

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
  const { country, language } = getPageLocale();
  upsertHeadMeta('ps-key', '6998-659da0480715a3000dcb7a24');
  upsertHeadMeta('ps-country', country);
  upsertHeadMeta('ps-language', language);
}

function loadThirdPartyAssets(blockData) {
  // Load external JS files
  if (blockData.externalJsPaths) {
    blockData.externalJsPaths.forEach((path) => {
      const { isJsPath, hasParams } = isExternalJs(path);
      if (isJsPath) {
        const options = {};
        if (!hasParams) {
          options.async = true;
          options.defer = true;
        }

        loadScript(path, { ...options, type: 'text/javascript' });
      }
    });
  }

  // Inject inline scripts
  if (blockData.externalScripts) {
    blockData.externalScripts.forEach((script) => {
      if (isInlineScript(script)) {
        injectInlineScript(script);
      }
    });
  }
}

function scheduleThirdPartyAssets(blockData) {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      loadThirdPartyAssets(blockData);
    }, 0);
  });
}

function buildBlockData(block) {
  const div = block.querySelectorAll(':scope > div');

  return {
    externalJsPaths: div[0]?.textContent.split(',').map((path) => path.trim()).filter(Boolean),
    externalScripts: [
      div[1]?.textContent,
      div[2]?.textContent,
      div[3]?.textContent,
    ].filter(Boolean),
  };
}

function buildIframeContent(blockData) {
  const { language } = getPageLocale();

  const iframeEle = document.createElement('div');
  let isIframe = false;

  if (blockData.externalScripts) {
    blockData.externalScripts.forEach((iframeDiv) => {
      if (isIframeDiv(iframeDiv)) {
        isIframe = true;
        const tempEle = document.createElement('div');
        tempEle.innerHTML = iframeDiv.trim().replaceAll('#lang#', language);
        iframeEle.appendChild(tempEle.firstElementChild);
      }
    });
  }

  return {
    isIframe,
    iframeEle,
  };
}

export default async function decorate(block) {
  const blockData = buildBlockData(block);
  const { isIframe, iframeEle } = buildIframeContent(blockData);

  // handle iframe integration
  if (isIframe) {
    block.replaceChildren(iframeEle);
    return;
  }

  // handle default content
  const isEditing = await isUniversalEditorAsync();
  if (isEditing) {
    const wrapper = document.createElement('div');
    wrapper.innerText = 'Third Party Integration';
    block.replaceChildren(wrapper);
    return;
  }

  applyPriceSpiderMetaTags();
  block.replaceChildren();
  scheduleThirdPartyAssets(blockData);
}
