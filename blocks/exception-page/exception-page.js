import { readBlockConfig } from '../../scripts/aem.js';
import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';

export function decorateExceptionButton(block) {
  const btn = block.querySelector('.btnlink');
  const btnText = block.querySelector('.btntext');
  const label = btnText?.innerText?.trim() || '';
  const link = btn?.querySelector('a');

  if (!label || !link) {
    btn?.remove();
    btnText?.remove();
    return;
  }

  link.innerText = label;
  link.title = label;
  btnText.remove();
  block.append(btn);
}

export default function decorate(block) {
  const config = readBlockConfig(block);
  // add className
  [...block.children].forEach((d) => {
    const key = d.children[0].textContent.trim();

    if (key && Object.keys(config).includes(key.toLowerCase())) {
      d.classList.add(key);
      d.children[0].remove();
    }
  });

  const textArea = document.createElement('div');
  textArea.className = 'text-area';
  const title = block.querySelector('.exceptiontitle');
  const description = block.querySelector('.exceptiondescription');
  textArea.append(title, description);
  block.append(textArea);
  decorateExceptionButton(block);

  getDynamicHeaderHeight(block);
}
