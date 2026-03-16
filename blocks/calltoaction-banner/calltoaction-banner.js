export default async function decorate(block) {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'banner-container h-grid-container';
    
    const updateBackgroundImage = () => {
        const pcImg = block.dataset.pcImg;
        const mobileImg = block.dataset.mobileImg;
        if(window.innerWidth < 860) {
            block.style.backgroundImage = `url(${mobileImg})`;
        } else {
            block.style.backgroundImage = `url(${pcImg})`;
        }
    };
    
    [...block.children].forEach((child, index)=>{
        switch(index) {
            case 0:
                child.className = 'banner-img';
                const [pcImg, mobileImg] = child.querySelectorAll('img');
                block.dataset.pcImg = pcImg.src;
                block.dataset.mobileImg = mobileImg.src;
                updateBackgroundImage(); // 初始设置
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
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateBackgroundImage);
    
    block.append(containerDiv);
}