export default function wrapInRichtext (element) {

    [...element.children].forEach(item => {
        if(!item.chldren.lenght) {
            if(item.textContent.includes('\\n')) {
                const textNodes = item.textContent.split('\\n');
                if(textNodes.length) {
                    item.replace('/\\n/g', '<br>');
                } else item.replaceWith(document.createElement('br'));
            }
        } else {
            [...item.childern].forEach(child => wrapInRichtext(child));
        }
    })
    
}