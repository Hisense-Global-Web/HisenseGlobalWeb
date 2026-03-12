export default async function decorate(block) {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'banner-container h-grid-container';
    [...block.children].forEach((child, index)=>{
        switch(index) {
            case 0:
                child.className = 'banner-img';
                block.style.backgroundImage = `url(${child.querySelector('img').src})`;
                child.remove();    
                break;
            case 1:
                child.className = 'banner-title';
                containerDiv.append(child);
                break;
            default:
                child.className = 'banner-btn';
                child.querySelector('a').textContent = child.querySelector('.button-container').nextElementSibling?.textContent.trim();
                console.log(child);
                containerDiv.append(child);
                child.querySelector('.button-container').nextElementSibling?.remove();
                

        }
    })
    block.append(containerDiv);
}