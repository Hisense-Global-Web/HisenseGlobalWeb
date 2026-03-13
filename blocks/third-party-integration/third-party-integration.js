import { isUniversalEditorAsync } from '../../utils/ue-helper.js';
import { loadScript } from '../../scripts/aem.js';

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
  const temp = document.createElement('div');
  temp.innerHTML = scriptTag.trim();
  const script = temp.querySelector('script');
  if (script) {
    const newScript = document.createElement('script');
    if (script.src) {
      newScript.src = script.src;
    } else {
      newScript.textContent = script.textContent;
    }
    document.head.appendChild(newScript);
  }
}

export default async function decorate(block) {
  // Build block data
  const div = block.querySelectorAll(':scope > div');
  const blockData = {
    externalJsPaths: div[0]?.textContent.split(',').map((path) => path.trim()),
    externalScripts: [
      div[1]?.textContent,
      div[2]?.textContent,
      div[3]?.textContent,
    ],
  };

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

  // Inject iframe divs
  const iframeEle = document.createElement('div');
  let isIframe = false;
  if (blockData.externalScripts) {
    blockData.externalScripts.forEach((iframeDiv) => {
      if (isIframeDiv(iframeDiv)) {
        isIframe = true;
        // Create a temporary div to parse and append the iframe
        const tempEle = document.createElement('div');
        tempEle.innerHTML = iframeDiv.trim();
        iframeEle.appendChild(tempEle.firstElementChild);
      }
    });
  }

  // price spider meta tags
  const pageNames = window.location.pathname.split('/');
  const country = pageNames[0].length === 2 ? pageNames[0] : '';
  const language = pageNames.length > 2 && pageNames[1].length === 2 ? pageNames[1] : 'en';
  document.head.innerHTML += `
  <meta name="ps-key" content="6998-659da0480715a3000dcb7a24"/>
  <meta name="ps-country" content="${country}"/>
  <meta name="ps-language" content="${language}"/>`;

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

  block.innerHTML = '';
}
