import { readBlockConfig } from "../../scripts/aem.js";
export default function decorate(block) {
    const config = readBlockConfig(block);
    const [icon, title, description, btnText, btnLink] = block.children;
    console.log(config);
    
    // add className
    [icon, title, description, btnText, btnLink].forEach(d => {
        const key = d.children[0].textContent.trim();
        console.log(Object.keys(config).includes(key.toLowerCase()));
        
        if(key && Object.keys(config).includes(key.toLowerCase())) {
            d.classList.add(key);
            d.children[0].remove();
        }
    })

    const textArea = document.createElement('div');
    textArea.className = 'textArea';
    textArea.append(title, description);
    block.append(textArea);
    btnLink.querySelector('a').innerText = btnText.innerText.trim();
    btnText.remove();
    block.append(btnLink);
}