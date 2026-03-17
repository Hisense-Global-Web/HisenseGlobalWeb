/* eslint-disable no-console */
import { getLocaleFromPath, localizeProductApiPath } from '../../scripts/locale-utils.js';
import { processPath } from '../../utils/carousel-common.js';

const { country } = getLocaleFromPath();
export default async function decorate(block) {
  const rows = [...(block.children || [])];
  let fields = [];
  let faqIconEl = null;
  let faqLink = '';
  let linkSku = '';
  rows.forEach((row, i) => {
    const text = row.textContent && row.textContent.trim();
    if (i === 1) {
      linkSku = row.textContent && row.textContent.trim();
    }
    if (i === 2 && text && text.indexOf(',') >= 0) {
      fields = text.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (fields.includes('faq')) {
      if (i === 3) {
        faqIconEl = row.querySelector('img');
      }
      if (i === 4) {
        const str = processPath(row.textContent.trim() || '');
        faqLink = `${str}?sku=${linkSku}`;
      }
    }
  });
  const link = block.querySelector('a');
  const endpoint = link ? link.getAttribute('href').trim() : '';

  const skuEl = block.querySelector('p[data-aue-prop="sku"]')
    || Array.from(block.querySelectorAll('p'))[1]
    || block.querySelector('p');
  const sku = skuEl ? skuEl.textContent.trim() : '';

  console.log('product-section: endpoint =', endpoint, 'sku =', sku);

  if (!endpoint || !sku) return;

  function simpleHash(str) {
    const s = String(str);
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
      h = (h * 31 + s.charCodeAt(i)) % 2147483647;
    }
    return Math.abs(h).toString(36);
  }

  /**
   * Get GraphQL endpoint URL with base URL
   */
  function getGraphQLUrl(endpointPath) {
    let path = localizeProductApiPath(endpointPath);
    const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
    const isAemEnv = hostname.includes('author') || hostname.includes('publish');

    if (isAemEnv && path && path.endsWith('.json')) {
      let pathWithoutJson = path.replace(/\.json$/, '');
      pathWithoutJson = pathWithoutJson.replace(/^\/product\/?/, '/') || '/';
      path = `/bin/hisense/productList.json?path=${pathWithoutJson}`;
    }

    const baseUrl = window.GRAPHQL_BASE_URL || '';
    let url;
    if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
      url = path;
    } else {
      url = baseUrl ? `${baseUrl}${path}` : path;
    }
    const fiveMinutesMs = 5 * 60 * 1000;
    const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
    const sep = url.indexOf('?') >= 0 ? '&' : '?';
    return `${url}${sep}_t=${cacheBuster}`;
  }

  const url = getGraphQLUrl(endpoint);

  /**
   * 将新的 GraphQL 返回结构转换为可用的产品数组格式
   */
  function transformTagStructureToProducts(tagData) {
    if (!tagData) return [];

    if (Array.isArray(tagData)) {
      return tagData;
    }

    if (tagData.data && Array.isArray(tagData.data)) {
      return tagData.data;
    }

    if (tagData.data && tagData.data.productModelList && Array.isArray(tagData.data.productModelList.items)) {
      return tagData.data.productModelList.items;
    }

    return [];
  }

  let json = null;
  try {
    const resp = await fetch(url);
    json = await resp.json();
  } catch (err) {
    console.error('product-section: failed to fetch product data, using mock', err);
    /* mock data */
    json = {};
  }

  let items = null;
  // 使用统一的数据转换函数处理 GraphQL 返回的各种格式
  items = transformTagStructureToProducts(json);

  // 根据SKU找到对应的产品
  const currentProduct = items ? items.find((item) => item.sku === sku) : null;
  const product = currentProduct || (items && items[0] ? items[0] : null);
  if (product.category) {
    faqLink += `&category=${product.category}`;
  }

  // 将当前产品数据保存到window中供spec组件使用
  window.currentProduct = product;

  // 获取当前产品的factoryModel，找到同型号的产品
  const factoryModel = product ? product.factoryModel : null;
  const similarProducts = factoryModel && items
    ? items.filter((item) => item.factoryModel === factoryModel)
    : [];

  const info = document.createElement('div');
  info.className = 'pdp-info';

  const fav = document.createElement('div');
  fav.className = 'pdp-favorite';
  const likeEmpty = document.createElement('img');
  likeEmpty.src = `/content/dam/hisense/${country}/common-icons/like-empty.svg`;
  fav.appendChild(likeEmpty);
  const like = document.createElement('img');
  like.src = `/content/dam/hisense/${country}/common-icons/like.svg`;
  fav.appendChild(like);

  const series = document.createElement('div');
  series.className = 'pdp-series';
  series.textContent = (product && product.series) ? product.series : '';

  const title = document.createElement('h1');
  title.className = 'pdp-title';
  title.textContent = (product && product.title) ? product.title : '';

  const ratingWrapper = document.createElement('div');
  ratingWrapper.classList.add('rating-wrapper');

  for (let i = 1; i <= 5; i += 1) {
    const starImg = document.createElement('img');
    starImg.classList.add('rating-star');
    starImg.src = i <= Math.floor(product.score)
      ? `/content/dam/hisense/${country}/common-icons/icon-carousel/star-02.svg`
      : `/content/dam/hisense/${country}/common-icons/icon-carousel/star-01.svg`;
    starImg.alt = i <= product.score ? '满星' : '空白星';
    ratingWrapper.appendChild(starImg);
  }
  const ratingText = document.createElement('span');
  ratingText.classList.add('rating-text');
  ratingText.textContent = `${product.score} (${product.totalRatings} Ratings)`;
  ratingWrapper.appendChild(ratingText);

  const price = document.createElement('div');
  price.className = 'pdp-price';
  price.textContent = (product && product.price) ? product.price : '$39,999.00';

  const sizesWrapper = document.createElement('div');
  sizesWrapper.className = 'pdp-sizes';
  // color
  const colorsWrapper = document.createElement('div');
  colorsWrapper.className = 'pdp-colors';
  const hasColorValue = similarProducts.some((item) => item.colorRGB);
  const sizeProducts = similarProducts.filter((item) => item.size);
  const hasSizeValue = sizeProducts.length > 0;
  if (similarProducts.length > 0) {
    // size 和 color 同时有值 优先显示color
    if (hasColorValue) {
      // const colorOrder = ['black', 'white', 'grey', 'silver', 'red', 'yellow', 'blue'];

      // // 创建颜色到索引的映射
      // const colorIndexMap = new Map(
      //   colorOrder.map((color, index) => [color, index]),
      // );

      // const sortedProducts = similarProducts.sort((a, b) => {
      //   const indexA = colorIndexMap.has(a.color) ? colorIndexMap.get(a.color) : Infinity;
      //   const indexB = colorIndexMap.has(b.color) ? colorIndexMap.get(b.color) : Infinity;
      //   return indexA - indexB;
      // });

      similarProducts.forEach((p) => {
        const el = document.createElement('div');
        el.classList.add('pdp-color');
        el.style.backgroundColor = p.colorRGB;
        if (p.colorRGB && (p.colorRGB.toLowerCase() === '#fff'
        || p.colorRGB.toLowerCase() === '#ffffff'
        || p.colorRGB.toLowerCase() === 'white'
        || p.colorRGB.toLowerCase() === 'rgb(255, 255, 255)')) {
          el.style.border = '1px solid #cfcfcf';
        }
        el.setAttribute('data-sku', p.sku);
        el.setAttribute('data-title', p.title);

        // 默认勾选当前SKU对应的尺寸
        if (p.sku === sku) {
          el.classList.add('selected');
        }

        // 添加点击事件
        el.addEventListener('click', () => {
        // 如果当前已经是选中状态，不执行跳转
          if (el.classList.contains('selected')) {
            return;
          }

          // 跳转到对应产品的whereToBuyLink链接
          let productLink = (p.whereToBuyLink || p.productDetailPageLink) || '';
          if (productLink) {
          // 如果当前URL是hisense.com/us，把链接中的/us/en改成/us
            if (window.location.hostname.includes('hisense.com') && window.location.pathname.startsWith('/us')) {
              productLink = productLink.replace('/us/en', '/us');
            }
            window.location.href = productLink;
          }
        });

        colorsWrapper.appendChild(el);
      });
    } else if (hasSizeValue) {
      // 对尺寸进行升序排序
      const sortedProducts = sizeProducts.sort((a, b) => {
        const sizeA = parseInt(a.size, 10);
        const sizeB = parseInt(b.size, 10);
        return sizeA - sizeB;
      });

      sortedProducts.forEach((p) => {
        const el = document.createElement('div');
        el.className = 'pdp-size';
        el.textContent = p.size;
        el.setAttribute('data-sku', p.sku);
        el.setAttribute('data-title', p.title);

        // 默认勾选当前SKU对应的尺寸
        if (p.sku === sku) {
          el.classList.add('selected');
        }

        // 添加点击事件
        el.addEventListener('click', () => {
        // 如果当前已经是选中状态，不执行跳转
          if (el.classList.contains('selected')) {
            return;
          }

          // 跳转到对应产品的whereToBuyLink链接
          let productLink = (p.whereToBuyLink || p.productDetailPageLink) || '';
          if (productLink) {
          // 如果当前URL是hisense.com/us，把链接中的/us/en改成/us
            if (window.location.hostname.includes('hisense.com') && window.location.pathname.startsWith('/us')) {
              productLink = productLink.replace('/us/en', '/us');
            }
            window.location.href = productLink;
          }
        });

        sizesWrapper.appendChild(el);
      });
    }
  }

  const badges = document.createElement('div');
  badges.className = 'pdp-badges';
  const badgesMobileGroup = document.createElement('div');
  badgesMobileGroup.className = 'pdp-badges-mobile-group';
  const badgesMobile = document.createElement('div');
  badgesMobile.className = 'pdp-badges-mobile';
  const badgesMobileTitle = document.createElement('div');
  badgesMobileTitle.className = 'pdp-badges-mobile-title';
  badgesMobileTitle.textContent = 'award winning';
  badgesMobileGroup.appendChild(badgesMobileTitle);
  if (product && Array.isArray(product.awards) && product.awards.length) {
    product.awards.forEach((award) => {
      const b = document.createElement('div');
      b.className = 'pdp-badge';
      const img = document.createElement('img');
      img.alt = 'award';
      // eslint-disable-next-line dot-notation
      const awardPath = award.path || award['_path'] || '';
      img.src = awardPath;
      img.loading = 'lazy';
      b.appendChild(img);
      badges.appendChild(b.cloneNode(true));
      const badgesMobileItem = document.createElement('div');
      badgesMobileItem.className = 'badges-mobile-item';
      badgesMobileItem.appendChild(b.cloneNode(true));
      badgesMobile.appendChild(badgesMobileItem);
    });
    badgesMobileGroup.appendChild(badgesMobile);
  }

  const buy = document.createElement('button');
  buy.className = 'pdp-buy-btn ps-widget';
  buy.setAttribute('ps-button-label', 'where to buy');
  buy.setAttribute('ps-sku', sku);
  // const buyLink = (product && (product.whereToBuyLink || product.productDetailPageLink)) || '';
  // if (buyLink) {
  //   buy.addEventListener('click', () => { window.location.href = buyLink; });
  // }

  const cart = document.createElement('button');
  cart.className = 'pdp-buy-btn';
  cart.textContent = 'Add to Cart';
  cart.style.display = 'none';
  // const cartLink = (product && (product.whereToBuyLink || product.productDetailPageLink)) || '';
  // if (buyLink) {
  //   buy.addEventListener('click', () => { window.location.href = cartLink; });
  // }
  const btnGroup = document.createElement('div');
  btnGroup.className = 'pdp-btn-group';
  btnGroup.append(buy, cart);

  const linkGroupEl = document.createElement('div');
  linkGroupEl.className = 'pdp-btn-link-group';

  const faqEl = document.createElement('div');
  faqEl.className = 'pdp-faq-btn';
  if (faqIconEl && faqLink) {
    faqEl.appendChild(faqIconEl);
    const faqLinkSpan = document.createElement('span');
    faqLinkSpan.textContent = 'FAQ';
    faqEl.appendChild(faqLinkSpan);
    faqEl.addEventListener('click', () => {
      if (faqLink) window.location.href = faqLink;
    });
    linkGroupEl.appendChild(faqEl);
  }

  const specsBtn = document.createElement('div');
  specsBtn.className = 'pdp-specs-btn';
  const specsImg = document.createElement('img');
  specsImg.src = `/content/dam/hisense/${country}/common-icons/specs.svg`;
  specsImg.alt = 'specs';
  specsBtn.appendChild(specsImg);
  const specsSpan = document.createElement('span');
  specsSpan.textContent = 'SPECS';
  specsBtn.appendChild(specsSpan);
  specsBtn.addEventListener('click', () => {
    const targetElement = document.getElementById('specifications');
    if (!targetElement) {
      return;
    }
    window.scrollTo({
      top: targetElement.offsetTop,
      behavior: 'auto',
    });
  });
  linkGroupEl.appendChild(specsBtn);
  if (!fields.includes('favorite')) {
    fav.classList.add('hide');
  }
  if (!fields.includes('title')) {
    title.classList.add('hide');
  }
  if (!fields.includes('series')) {
    series.classList.add('hide');
  }
  if (!fields.includes('rating')) {
    ratingWrapper.classList.add('hide');
  }
  if (!fields.includes('buttons')) {
    btnGroup.classList.add('hide');
  }
  if (!fields.includes('priceInfo_regularPrice')) {
    price.classList.add('hide');
  }
  if (!fields.includes('awards')) {
    badges.classList.add('hide');
  }
  if (!fields.includes('position')) {
    specsBtn.classList.add('hide');
  }
  info.append(fav, series, title, ratingWrapper, price);
  if (hasColorValue) {
    info.append(colorsWrapper);
  } else if (hasSizeValue) {
    info.append(sizesWrapper);
  }
  info.append(badges, btnGroup, linkGroupEl, badgesMobileGroup);

  block.replaceChildren(info);

  const pdpNav = document.createElement('div');
  pdpNav.className = 'pdp-nav';
  pdpNav.innerHTML = `<div class="pdp-nav-content">
    <span>${(product && product.title) ? product.title : ''}</span>
    <img class="pdp-nav-content-btn" src="/content/dam/hisense/${country}/common-icons/chevron-up.svg"  alt=""/>
    </div>
  <div class="pdp-nav-menu hide"></div>`;

  pdpNav.querySelector('.pdp-nav-content-btn').addEventListener('click', () => {
    document.querySelector('.pdp-nav-menu').classList.toggle('hide');
  });
  const overviewMobileBtn = document.createElement('div');
  overviewMobileBtn.classList.add('pdp-nav-menu-item');
  overviewMobileBtn.textContent = 'Overview';
  overviewMobileBtn.addEventListener('click', () => {
    // const targetElement = document.getElementById('overview');
    // if (!targetElement) {
    //   return;
    // }
    // const targetPosition = targetElement.getBoundingClientRect().top;
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  });
  const specsMobileBtn = document.createElement('div');
  specsMobileBtn.classList.add('pdp-nav-menu-item');
  specsMobileBtn.textContent = 'Specs';
  specsMobileBtn.addEventListener('click', (e) => {
    const targetElement = document.getElementById('specifications');
    const headerTop = document.querySelector('.pdp-nav').getBoundingClientRect().height || 0;
    if (!targetElement) {
      return;
    }
    const grandParent = e.target.closest('.pdp-nav-menu');
    grandParent.classList.add('hide');
    window.scrollTo({
      top: targetElement.offsetTop - headerTop,
      behavior: 'auto',
    });
  });

  const faqMobileBtn = document.createElement('div');
  faqMobileBtn.classList.add('pdp-nav-menu-item');
  faqMobileBtn.textContent = 'Faq';
  faqMobileBtn.addEventListener('click', () => {
    if (faqLink) window.location.href = faqLink;
  });

  const pdpNavMenu = pdpNav.querySelector('.pdp-nav-menu');
  pdpNavMenu.append(overviewMobileBtn);
  let h = 61;
  if (fields.includes('position')) {
    pdpNavMenu.append(specsMobileBtn);
    h += 45;
  }
  if (faqLink) {
    pdpNavMenu.append(faqMobileBtn);
    h += 45;
  }
  pdpNavMenu.style.height = `${h}px`;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const blockHeight = block.getBoundingClientRect()?.height || 0;
    if (scrollTop > blockHeight) {
      pdpNav.querySelector('.pdp-nav-menu').style.display = 'flex';
      pdpNav.style.top = 0;
    } else {
      pdpNav.querySelector('.pdp-nav-menu').classList.add('hide');
      pdpNav.querySelector('.pdp-nav-menu').style.display = 'none';
      pdpNav.style.top = '-78px';
    }
  });

  block.appendChild(pdpNav);
}
