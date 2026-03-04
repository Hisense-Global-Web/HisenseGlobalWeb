export default function wrapInRichtext(element) {
    // if the element has no children or it's specifically an <li>,
    // operate on its innerHTML.  <li> tags may already contain
    // <br> elements, so we can't rely on textContent alone.
    if (!element.children.length || element.tagName === 'LI') {
        const html = element.innerHTML;

        // replace every literal "/n" sequence with a <br> element.
        // existing <br> tags are preserved, and if the li already
        // contains both <br> and "/n" the latter will simply be
        // converted without affecting the former.
        if (html.includes('/n')) {
            element.innerHTML = html.replace(/\/n/g, '<br>');
        }
    } else {
        // recursively process children
        [...element.children].forEach(child => wrapInRichtext(child));
    }
}
