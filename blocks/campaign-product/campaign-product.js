import { getGraphQLUrl } from '../../scripts/locale-utils.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

function createScrollButton(direction) {
  const button = document.createElement('div');
  button.type = 'button';
  button.className = `scroll-btn scroll-${direction}`;
  button.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
  button.disabled = direction === 'left';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left-g.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right-g.svg`;
  img.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right.svg`;
  imgClick.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
  return button;
}

// eslint-disable-next-line no-unused-vars
function updatePositionBarLeft(currentIndex, dataListLength) {
  const bar = document.querySelector('.data-position-bar');
  if (bar) {
    const totalWidth = 400;
    const barWidth = 100;
    const showItemCount = 4;
    const maxMoveDistance = totalWidth - barWidth;
    bar.style.left = `${(maxMoveDistance / Math.max((dataListLength - showItemCount), 1) || 0) * currentIndex}px`;
  }
}
export default async function decorate(block) {
  const data = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const row of [...block.children]) {
    row.classList.add('campaign-category');
    row.addEventListener('click', (e) => {
      const elList = e.currentTarget.parentNode.querySelectorAll('.campaign-category');
      elList.forEach((el) => {
        el.classList.remove('active');
      });
      e.target.classList.add('active');
    });
    const category = {
      name: '',
      src: '',
      products: [],
    };
    let itemAllList = null;
    const items = [...row.children];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];

      if (index === 0) {
        const imgEl = item.querySelector('img');
        category.src = imgEl?.src;
        item.classList.add('category-img');
      } else if (index === 1) {
        category.name = item.textContent.trim();
        item.classList.add('category-title');
      } else if (index === 2) {
        const aEl = item.querySelector('a');
        const href = aEl.getAttribute('href').trim() ?? '';
        const fixHref = getGraphQLUrl(href);
        try {
          // eslint-disable-next-line no-await-in-loop
          const resp = await fetch(fixHref);
          // eslint-disable-next-line no-await-in-loop
          const respJson = await resp.json();
          itemAllList = respJson.data.productModelList.items;
        } catch (err) {
          console.error('请求失败', err);
        }
        item.style.display = 'none';
      } else {
        const filterSku = item.textContent.trim();
        const currentProduct = itemAllList?.find((p) => p.sku === filterSku);
        if (currentProduct) {
          category.products.push(currentProduct);
        }
        item.style.display = 'none';
      }
    }
    data.push(category);
  }
  const flatList = [];
  // 这里mock一些数据
  [...data, ...data, ...data, ...data, ...data].forEach((series, sIndex) => {
    series.products.forEach((p) => {
      flatList.push({
        ...p,
        seriesIndex: sIndex,
      });
    });
  });
  const previewGroupEl = document.createElement('div');
  previewGroupEl.classList.add('preview-group');
  const previewListEl = document.createElement('div');
  previewListEl.classList.add('preview-list');
  console.log(flatList);
  flatList.forEach((item) => {
    console.log(item);
    const card = document.createElement('div');
    card.className = 'product-card';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'product-card-title';
    const productCardTag = document.createElement('div');
    productCardTag.className = 'product-card-tag';
    titleDiv.append(productCardTag);

    const fav = document.createElement('div');
    fav.className = 'favorite favorite-pending';
    // setControlLoadingState(fav, false);
    const likeEmpty = document.createElement('img');
    likeEmpty.className = 'like-empty';
    likeEmpty.src = `/content/dam/hisense/${country}/common-icons/like-empty.svg`;
    fav.appendChild(likeEmpty);
    const like = document.createElement('img');
    like.className = 'like';
    like.src = `/content/dam/hisense/${country}/common-icons/like.svg`;
    fav.appendChild(like);
    titleDiv.append(fav);

    const imgDiv = document.createElement('div');
    imgDiv.className = 'product-img';
    const imgPath = (() => {
      if (!item || !item.mediaGallery_image) return null;
      const pKey = Object.keys(item.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
      return pKey ? item.mediaGallery_image[pKey] : null;
    })();
    if (imgPath) {
      const img = document.createElement('img');
      img.src = imgPath;
      imgDiv.appendChild(img);
    }


    const seriesDiv = document.createElement('div');
    seriesDiv.className = 'product-series';
    if (item.series) seriesDiv.textContent = item.series;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    const metaTitle = (() => {
      if (!item) return null;
      const metaKey = Object.keys(item).find((k) => k.toLowerCase().includes('metadata'));
      const meta = metaKey ? item[metaKey] : null;
      if (meta && Array.isArray(meta.stringMetadata)) {
        const found = meta.stringMetadata.find((x) => x.name === 'title');
        return found ? found.value : null;
      }
      return null;
    })();
    const fullTitle = item.title || metaTitle || '';
    nameDiv.textContent = fullTitle;
    nameDiv.title = fullTitle;

    const priceGroupDiv = document.createElement('div');
    priceGroupDiv.className = 'product-price-group';
    priceGroupDiv.style.display = 'none';
    const currentPriceEl = document.createElement('h5');
    currentPriceEl.className = 'product-current-price';
    const currentPriceCurrency = document.createElement('span');
    const currentPriceValue = document.createElement('span');
    currentPriceEl.append(currentPriceCurrency, currentPriceValue);
    const originalPriceEl = document.createElement('div');
    originalPriceEl.className = 'product-original-price';
    const originalPriceCurrency = document.createElement('span');
    const originalPriceValue = document.createElement('span');
    originalPriceEl.append(originalPriceCurrency, originalPriceValue);
    
    const discountsDiv = document.createElement('div');
    discountsDiv.className = 'product-discounts';
    const discountsTitle = document.createElement('span');
    discountsTitle.textContent = 'Save';
    const discountsCurrency = document.createElement('span');
    const discountsValue = document.createElement('span');
    discountsDiv.append(discountsTitle, discountsCurrency, discountsValue);
    priceGroupDiv.append(currentPriceEl, originalPriceEl, discountsDiv);

    // create product button group
    const productBtnGroupEl = document.createElement('div');
    productBtnGroupEl.className = 'product-btn-group';
    
    card.append(titleDiv, imgDiv, seriesDiv, nameDiv, priceGroupDiv, productBtnGroupEl);
    previewListEl.appendChild(card);
  });

  const ctrlGroupEl = document.createElement('div');
  ctrlGroupEl.classList.add('ctrl-group');
  const positionBarEl = document.createElement('div');
  positionBarEl.classList.add('position-bar');
  const dataPositionBarEl = document.createElement('div');
  dataPositionBarEl.classList.add('data-position-bar');
  positionBarEl.append(dataPositionBarEl);
  const leftBtn = createScrollButton('left');
  const rightBtn = createScrollButton('right');
  const btnGroupEl = document.createElement('div');
  btnGroupEl.classList.add('btn-group');
  btnGroupEl.append(leftBtn, rightBtn);
  ctrlGroupEl.append(positionBarEl, btnGroupEl);
  previewGroupEl.append(previewListEl, ctrlGroupEl);
  block.parentNode.append(previewGroupEl);
}
