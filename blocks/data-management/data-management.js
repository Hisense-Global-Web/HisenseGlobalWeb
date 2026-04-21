import { injectInlineScript, isIframeDiv, isInlineScript } from '../../scripts/integration-utils.js';

export default async function decorate(block) {
  const div = block.querySelectorAll(':scope > div');
  const externalScripts = [div[0]?.textContent, div[1]?.textContent, div[2]?.textContent].filter(Boolean);

  externalScripts.forEach((script) => {
    if (isInlineScript(script)) {
      injectInlineScript(script);
    }

    if (isIframeDiv(script)) {
      block.appendChild(script);
    }
  });
}
