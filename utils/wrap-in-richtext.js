export default function wrapInRichtext(element) {
  // if the element has no children or it's specifically an <li>,
  // operate on its innerHTML.  <li> tags may already contain
  // <br> elements, so we can't rely on textContent alone.
  if (!element.children.length || element.tagName === 'LI' || [...element.children].every((tag) => tag.tagName === 'A')) {
    const html = element.innerHTML;

    // replace every literal "/n" sequence with a <br> element.
    // existing <br> tags are preserved, and if the element
    // already contains both <br> and "/n" the latter will simply be
    // converted without affecting the former.
    // we also need to handle trailing "/n" markers specially:
    // if the content ends in one or more "/n", those markers
    // should be removed from the element and converted into
    // one or more <br> elements inserted *after* the element.

    // look for one or more /n sequences at the very end of the html
    const trailingMatch = html.match(/(?:\/n)+$/);
    if (trailingMatch) {
      // count how many occurrences (each "/n" is two chars)
      const count = (trailingMatch[0].match(/\/n/g) || []).length;
      // strip them from the innerHTML
      element.innerHTML = html.replace(/(?:\/n)+$/, '');
      // insert the corresponding number of <br> elements after the element
      for (let i = 0; i < count; i += 1) {
        const wrapEl = document.createElement('br');
        element.insertAdjacentElement('afterend', wrapEl);
      }
    } else if (html.includes('/n')) {
      // simple replacement for interior /n markers
      element.innerHTML = html.replace(/\/n/g, '<br>');
    }
  } else {
    // recursively process children
    [...element.children].forEach((child) => wrapInRichtext(child));
  }
}
