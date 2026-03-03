import { isUniversalEditorAsync } from '../../utils/ue-helper.js';

// Functions
function isExternalJs(url) {
  return /^https?:\/\/.+\.js$/.test(url) || url.endsWith('.js');
}

function isInlineScript(text) {
  return /^<script[\s\S]*?>[\s\S]*?<\/script>$/.test(text.trim());
}

function loadExternalScript(url) {
  const script = document.createElement('script');
  script.src = url;
  script.async = true;
  document.head.appendChild(script);
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
      if (isExternalJs(path)) {
        loadExternalScript(path);
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

  // price spider meta tags
  const pageNames = window.location.pathname.split('/');
  const country = pageNames[0].length === 2 ? pageNames[0] : '';
  const language = pageNames.length > 2 && pageNames[1].length === 2 ? pageNames[1] : 'en';

  document.head.innerHTML += `
  <meta name="ps-key" content="6998-659da0480715a3000dcb7a24"/>
  <meta name="ps-country" content="${country}"/>
  <meta name="ps-language" content="${language}"/>`;

  const isEditing = await isUniversalEditorAsync();
  if (isEditing) {
    const wrapper = document.createElement('div');
    wrapper.innerText = 'Third Party Integration';
    block.replaceChildren(wrapper);
    return;
  }
  block.innerHTML = '';
}
