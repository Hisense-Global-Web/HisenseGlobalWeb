import { getGraphQLUrl } from '../../scripts/locale-utils.js';
const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

function createScrollButton(direction) {
  const button = document.createElement('button');
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
  data.forEach((series, sIndex) => {
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

  const ctrlGroupEl = document.createElement('div');
  ctrlGroupEl.classList.add('ctrl-group');
  const positionBarEl = document.createElement('div');
  positionBarEl.classList.add('position-bar');
  
  previewGroupEl.append(previewListEl, ctrlGroupEl);
  block.parentNode.append(previewGroupEl);
}
