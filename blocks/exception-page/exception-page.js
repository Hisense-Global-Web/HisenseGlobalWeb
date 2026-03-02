import { readBlockConfig } from "../../scripts/aem.js";
export default function decorate(block) {
    const config = readBlockConfig(block);
    const [icon, title, description, btn] = block.children;
    
    // add className
    [icon, title, description, btn].forEach(d => {
        if(d.firstElement?.textContent.trim() && Object.keys(config).includes(d.firstElement.textContent.trim())) {
            d.className = d.firstElement.textContent.trim();
            d.firstElement.remove();
        }
    })

    const textArea = document.createElement('div');
    textArea.className = 'textArea';
    textArea.append(title, description);
    block.append(textArea);
    const link = btn.querySelector('a');
    if (link) {
        link.innerText = link.parentElement.previousElementSibling.innerText;
        link.title = link.parentElement.previousElementSibling.innerText;
        link.parentElement.previousElementSibling.remove();
    }
    block.append(btn);
}