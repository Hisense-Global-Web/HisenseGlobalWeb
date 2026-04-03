import { loadFragment } from '../fragment/fragment.js';
import { getFragmentPath, isFooterPage } from '../../scripts/locale-utils.js';
import { isAuthorHostname } from '../../scripts/environment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // clean footer page content in eds side
  if (!isAuthorHostname() && isFooterPage()) {
    document.head.remove();
    document.body.remove();
    return;
  }

  // load footer as fragment
  const footerPath = getFragmentPath('footer');
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
