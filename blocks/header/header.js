import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function parseLogo(root) {
  const logoImg = root.querySelector('.navigation-logo-wrapper img');
  const logoHref = root.querySelector('.navigation-logo-wrapper a')?.href || '/';
  return {
    src: logoImg?.src || '',
    href: logoHref,
    alt: logoImg?.alt || 'logo',
  };
}

function parseNavItems(root) {
  return Array.from(root.querySelectorAll('.navigation-item-wrapper')).map((wrapper) => {
    const title = wrapper.querySelector('p:not(.button-container)')?.textContent?.trim() || '';
    const href = wrapper.querySelector('.button-container a')?.href || '#';
    return { title, href };
  });
}

function parseActions(root) {
  return Array.from(root.querySelectorAll('.navigation-action-wrapper')).map((wrapper) => {
    const title = wrapper.querySelector('p:not(.button-container)')?.textContent?.trim() || '';
    const href = wrapper.querySelector('.button-container a')?.href || '#';
    const img = wrapper.querySelector('img')?.src;
    return { title, href, img };
  });
}

function parseDropdownProducts(col) {
  const products = [];
  if (!col) return products;
  const children = Array.from(col.children);
  for (let i = 0; i < children.length; i += 1) {
    const node = children[i];
    const pictureImg = node.tagName === 'P' ? node.querySelector('img') : null;
    if (pictureImg) {
      let text = '';
      for (let j = i + 1; j < children.length; j += 1) {
        const next = children[j];
        const isTextP = next.tagName === 'P' && !next.querySelector('img') && !next.querySelector('a');
        if (isTextP && next.textContent.trim()) {
          text = next.textContent.trim();
          i = j;
          break;
        }
      }
      products.push({ img: pictureImg.src, text });
    }
  }
  return products;
}

function parseDropdownLinks(col) {
  if (!col) return [];
  return Array.from(col.querySelectorAll('p')).flatMap((p) => {
    const text = p.textContent.trim();
    const href = p.querySelector('a')?.href || '#';
    return text ? [{ text, href }] : [];
  });
}

function parseDropdownBtns(col) {
  if (!col) return [];
  return Array.from(col.querySelectorAll('p')).map((p) => p.textContent.trim()).filter(Boolean);
}

function parseDropdowns(root) {
  return Array.from(root.querySelectorAll('.columns-container')).map((container) => {
    const block = container.querySelector('.columns.block');
    const row = block?.querySelector(':scope > div');
    const [productsCol, linksCol, btnsCol] = row ? Array.from(row.children) : [];
    return {
      products: parseDropdownProducts(productsCol),
      links: parseDropdownLinks(linksCol),
      btns: parseDropdownBtns(btnsCol),
    };
  });
}

function buildDropdown(data) {
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-dropdown';
  const content = document.createElement('div');
  content.className = 'dropdown-content';

  const main = document.createElement('div');
  main.className = 'dropdown-main';

  const productsWrap = document.createElement('div');
  productsWrap.className = 'dropdown-products';
  data.products.forEach((item) => {
    const product = document.createElement('div');
    product.className = 'dropdown-product';
    const imgWrap = document.createElement('div');
    imgWrap.className = 'dropdown-product-img';
    if (item.img) {
      const img = document.createElement('img');
      img.src = item.img;
      img.alt = item.text || '';
      imgWrap.append(img);
    }
    const text = document.createElement('div');
    text.className = 'dropdown-product-text';
    text.textContent = item.text || '';
    product.append(imgWrap, text);
    productsWrap.append(product);
  });

  const linksWrap = document.createElement('div');
  linksWrap.className = 'dropdown-links';
  data.links.forEach((link) => {
    const div = document.createElement('div');
    if (link.href && link.href !== '#') {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      div.append(a);
    } else {
      div.textContent = link.text;
    }
    linksWrap.append(div);
  });

  main.append(productsWrap, linksWrap);

  const btnWrap = document.createElement('div');
  btnWrap.className = 'dropdown-btns';
  data.btns.forEach((text) => {
    const btn = document.createElement('button');
    btn.className = 'dropdown-btn';
    btn.textContent = text;
    btnWrap.append(btn);
  });

  content.append(main, btnWrap);
  dropdown.append(content);
  return dropdown;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // 解析原始DOM
  const logo = parseLogo(fragment);
  const navItems = parseNavItems(fragment);
  const actions = parseActions(fragment);
  const dropdowns = parseDropdowns(fragment);

  // 构建新的导航DOM
  const navigation = document.createElement('div');
  navigation.id = 'navigation';

  const navContainer = document.createElement('div');
  navContainer.className = 'nav-container';

  const logoEl = document.createElement('div');
  logoEl.className = 'nav-logo';
  if (logo.src) {
    const a = document.createElement('a');
    a.href = logo.href;
    const img = document.createElement('img');
    img.src = logo.src;
    img.alt = logo.alt;
    a.append(img);
    logoEl.append(a);
  }

  const linksEl = document.createElement('div');
  linksEl.className = 'nav-links';
  navItems.forEach((item, idx) => {
    const link = document.createElement('div');
    link.className = 'nav-link';
    link.textContent = item.title;
    if (item.href && item.href !== '#') {
      link.dataset.href = item.href;
      link.addEventListener('click', () => {
        window.location.href = item.href;
      });
    }
    const dropdownData = dropdowns[idx];
    if (dropdownData && (dropdownData.products.length || dropdownData.links.length || dropdownData.btns.length)) {
      const mask = document.createElement('div');
      mask.className = 'nav-mask';
      mask.id = 'nav-mask';
      const dropdown = buildDropdown(dropdownData);
      link.append(mask, dropdown);
    }
    linksEl.append(link);
  });

  const actionsEl = document.createElement('div');
  actionsEl.className = 'nav-actions';
  actions.forEach((action) => {
    if (action.img) {
      const btn = document.createElement('div');
      btn.className = 'nav-action-btn';
      const img = document.createElement('img');
      img.src = action.img;
      img.alt = action.title || 'action';
      btn.append(img);
      actionsEl.append(btn);
      return;
    }
    const link = document.createElement('div');
    link.className = 'nav-link';
    link.textContent = action.title;
    if (action.href && action.href !== '#') {
      link.dataset.href = action.href;
      link.addEventListener('click', () => {
        window.location.href = action.href;
      });
    }
    actionsEl.append(link);
  });

  navContainer.append(logoEl, linksEl, actionsEl);
  navigation.append(navContainer);

  block.textContent = '';
  block.append(navigation);
}
