import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  let footerPath;
  if (footerMeta) {
    footerPath = new URL(footerMeta, window.location).pathname;
  } else {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean);
    if (currentPath.startsWith('/content/hisense')) {
      // 使用前四级路径 + /footer
      const basePath = `/${pathParts.slice(0, 4).join('/')}`;
      footerPath = `${basePath}/footer`;
    } else {
      // 使用前二级路径 + /footer
      const basePath = `/${pathParts.slice(0, 2).join('/')}`;
      footerPath = `${basePath}/footer`;
    }
  }
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
