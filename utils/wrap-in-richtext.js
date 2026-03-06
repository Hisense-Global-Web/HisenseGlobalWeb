export default function wrapInRichtext(element) {
  // if the element has no children or it's specifically an <li>,
  // operate on its innerHTML.  <li> tags may already contain
  // <br> elements, so we can't rely on textContent alone.
  if (!element.children.length || element.tagName === 'LI' || [...element.children].every((tag) => tag.tagName === 'A' || tag.tagName === 'BR')) {
    const html = element.innerHTML;

    // replace every literal "/n" sequence with a <br> element.
    // existing <br> tags are preserved, and if the element
    // already contains both <br> and "/n" the latter will simply be
    // converted without affecting the former.
    // we also need to handle trailing "/n" markers specially:
    // if the content ends in one or more "/n", those markers
    // should be removed from the element and converted into
    // one or more <br> elements inserted *after* the element.

    // First, handle interior /n markers (not at the end)
    let innerHtml = html;
    const trailingMatch = html.match(/(?:\/n)+$/);
    
    if (trailingMatch) {
      // Remove trailing /n from the string before checking for interior ones
      innerHtml = html.substring(0, html.length - trailingMatch[0].length);
    }
    
    // Replace interior /n markers with <br>
    if (innerHtml.includes('/n')) {
      element.innerHTML = innerHtml.replace(/\/n/g, '<br>');
    } else {
      element.innerHTML = innerHtml;
    }
    
    // Then handle trailing /n markers - insert <br> after element
    if (trailingMatch) {
      const count = (trailingMatch[0].match(/\/n/g) || []).length;
      for (let i = 0; i < count; i += 1) {
        const wrapEl = document.createElement('br');
        element.insertAdjacentElement('afterend', wrapEl);
      }
    }
  } else {
    // recursively process children
    [...element.children].forEach((child) => wrapInRichtext(child));
  }
}
