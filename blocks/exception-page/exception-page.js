import { readBlockConfig } from '../../scripts/aem.js';

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
  const btn = block.querySelector('.btnlink');
  const btnText = block.querySelector('.btntext');
  btn.querySelector('a').innerText = btnText.innerText.trim();
  btnText.remove();
  block.append(btn);
}
