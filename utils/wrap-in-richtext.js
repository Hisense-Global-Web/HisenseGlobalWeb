export default function wrapInRichtext (element) {
    if(![...element.children].length || element.tagName === 'LI') {
            if(String(element.textContent)?.includes('/n')) {
                const textNodes = element.textContent.split('/n');
                console.log(textNodes);
                
                if(textNodes.filter(item=>item).length) {
                    element.replace('//n/g','<br>');
                } else {
                    element.innerHTML = `<br>`;
                }
            }
            else {
                console.log(element,element.tagName,element.tagName==='LI');
                if(element.tagName === 'LI') {
                    console.log(element.textContent,'li-content');
                    // item.textContent.replace('//n/g', '<br>');
                }
            }
    } else {
        [...element.children].forEach(item => {
            wrapInRichtext(item);
        });
    }
    
}