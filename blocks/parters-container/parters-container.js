import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  console.log('parters-container config: ', config);
  // const title = config.title || '';
  // const text = config.text || '';
  // const highlightText = config['highlight-text'] || '';
  // const content = config.content || '';
  // const iconList = document.querySelectorAll('picture') || [];
  // const iconSrcList = [];
  // iconList.forEach((icon) => {
  //   iconSrcList.push(icon.querySelector('img')?.src || '');
  // });
  // const outWrapper = document.createElement('div');
  // outWrapper.className = 'out-wrapper';
  // const titleDiv = document.createElement('div');
  // titleDiv.className = 'parters-container-title';
  // titleDiv.textContent = title;
  // outWrapper.appendChild(titleDiv);
  // const textDiv = document.createElement('div');
  // textDiv.className = 'parters-container-text';
  // textDiv.textContent = text;
  // outWrapper.appendChild(textDiv);

  // if (iconSrcList?.length) {
  //   const iconWrapper = document.createElement('div');
  //   iconWrapper.className = 'parters-container-icon-wrapper';
  //   iconSrcList.forEach((src) => {
  //     const iconItem = document.createElement('div');
  //     iconItem.className = 'parters-container-icon-item';
  //     const icon = document.createElement('img');
  //     icon.className = 'parters-container-icon-item-img';
  //     icon.src = src;
  //     iconItem.appendChild(icon);
  //     iconWrapper.appendChild(iconItem);
  //   });
  //   outWrapper.appendChild(iconWrapper);
  // }

  // const highlightTextDiv = document.createElement('div');
  // highlightTextDiv.className = 'parters-container-highlight-text';
  // highlightTextDiv.textContent = highlightText;
  // outWrapper.appendChild(highlightTextDiv);
  // const contentDiv = document.createElement('div');
  // contentDiv.className = 'parters-container-content';
  // contentDiv.textContent = content;
  // outWrapper.appendChild(contentDiv);
  // block.replaceChildren(outWrapper);
}
