import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  const textContainer = document.createElement('div');
  textContainer.className = 'text-content';
  const textArea = document.createElement('div');
  textArea.className = 'text-area';
  const btnDiv = document.createElement('div');
  btnDiv.className = 'btn-cta';
  const titleArea = document.createElement('div');
  titleArea.className = 'title-area';
  textArea.appendChild(titleArea);
  const items = document.createElement('div');
  items.className = 'matrix-block-items';
  [...block.children].forEach((child) => {
    if (Object.keys(config).includes(child.firstElementChild?.textContent.trim().toLowerCase())) {
      child.classList.add(child.firstElementChild?.textContent.trim());
      child.firstElementChild.remove();
    }
    if(child.classList.contains('matrix-block-item')) {
      const label = ['matrix-label','matrix-value'];
      console.log(child);
      // blockItem 最少两个节点，最多4个节点
      const blockItem = Array.from(child.children);
      console.log(blockItem,'tem');
      for (let i = 0; i < blockItem.length; i += 2) {
        const labelDiv = blockItem[i];
        const valueDiv = blockItem[i + 1];
  
        // 获取标签内容，比如 "matrix-label" 或 "matrix-value"
        const labelText = labelDiv?.querySelector('p')?.textContent.trim();
  
        if (labelText && valueDiv) {
          // 将内容作为类名添加
          const className = labelText.toLowerCase();
          valueDiv.classList.add(className);
          labelDiv.remove();
        }
      }
    }
    if(!child.classList.contains('image')) {
      if(!child.className.includes('btn')) {
        if(child.className !== 'matrix-block-item') {
          titleArea.appendChild(child);
        } else items.appendChild(child);
      } else if(child.className.includes('btn')) {
        btnDiv.appendChild(child);
      } else {
        textContainer.appendChild(child);
      }
    }
  });
  [...items.children].forEach(item=> {
    if(item !== [...items.children][items.children.length-1]) {
      const line = document.createElement('span');
      line.className = 'line';
      item.after(line);
    }
  })
  textArea.appendChild(items);
  textContainer.appendChild(textArea);
  textContainer.appendChild(btnDiv);
  block.appendChild(textContainer);
}
