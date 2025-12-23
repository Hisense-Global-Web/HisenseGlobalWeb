import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  if (!path) return;

  try {
    const fragment = await loadFragment(path);
    console.log('pdp-product-info: loaded fragment', path, fragment);
    if (fragment) {
      console.log('pdp-product-info: fragment.innerHTML =', fragment.innerHTML);
    }
  } catch (err) {
    console.error('pdp-product-info: error loading fragment', path, err);
  }
}


