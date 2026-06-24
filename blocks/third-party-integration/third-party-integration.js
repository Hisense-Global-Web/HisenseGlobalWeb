import { isUniversalEditor } from '../../utils/ue-helper.js';
import { loadScript } from '../../scripts/aem.js';
import { getLocaleFromPath } from '../../scripts/locale-utils.js';
import {
  applyPriceSpiderMetaTags,
  sanitizeIframeSrcParams,
  fillIframePlaceholders,
  injectInlineScript,
  isExternalJs,
  isIframeDiv,
  isInlineScript,
} from '../../scripts/integration-utils.js';

function createIframeItem(iframeDiv, language) {
  const tempEle = document.createElement('div');
  tempEle.innerHTML = fillIframePlaceholders(iframeDiv, language);
  sanitizeIframeSrcParams(tempEle);

  return tempEle.firstElementChild;
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

function buildBlockData(block) {
  const div = block.querySelectorAll(':scope > div');

  return {
    externalJsPaths: div[0]?.textContent
      .split(',')
      .map((path) => path.trim())
      .filter(Boolean),
    externalScripts: [div[1]?.textContent, div[2]?.textContent, div[3]?.textContent].filter(Boolean),
  };
}

function buildIframeContent(blockData) {
  const { language } = getLocaleFromPath();

  const iframeEle = document.createElement('div');
  let isIframe = false;

  if (blockData.externalScripts) {
    blockData.externalScripts.forEach((iframeDiv) => {
      if (isIframeDiv(iframeDiv)) {
        isIframe = true;
        iframeEle.appendChild(createIframeItem(iframeDiv, language));
      }
    });
  }

  return {
    isIframe,
    iframeEle,
  };
}

export default function decorate(block) {
  const blockData = buildBlockData(block);
  const { isIframe, iframeEle } = buildIframeContent(blockData);

  applyPriceSpiderMetaTags();
  loadThirdPartyAssets(blockData);

  if (isIframe) {
    block.replaceChildren(iframeEle);
    return;
  }

  // handle default content
  const isEditing = isUniversalEditor();
  if (isEditing) {
    const wrapper = document.createElement('div');
    wrapper.innerText = 'Third Party Integration';
    block.replaceChildren(wrapper);
    return;
  }

  applyPriceSpiderMetaTags();
  block.replaceChildren();
}
