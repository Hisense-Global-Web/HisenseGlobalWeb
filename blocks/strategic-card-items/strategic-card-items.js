export default function decorate(block) {
    [...block.children].forEach(child=>{
        child.className = 'strategic-card-item';
        if(!child.children.length) return;
        const [iconDiv, textDiv, btnDiv] = child.children;
        iconDiv.className = 'card-icon';
        textDiv.className = 'card-text';
        btnDiv.className = 'card-btn';
        if(btnDiv && !btnDiv.textContent.trim()) {
            btnDiv.style.display = 'none';
        }
    })
}