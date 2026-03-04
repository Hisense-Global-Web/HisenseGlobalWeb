import wrapInRichtext from '../../utils/wrap-in-richtext.js';

export default function decorate(block) {
    console.log(block);
    
    wrapInRichtext(block);
}