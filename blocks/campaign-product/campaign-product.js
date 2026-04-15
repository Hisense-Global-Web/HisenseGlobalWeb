import { getGraphQLUrl } from '../../scripts/locale-utils.js';

export default async function decorate(block) {
  const data = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const row of [...block.children]) {
    row.classList.add('campaign-category');
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
      } else if (index === 1) {
        category.name = item.textContent.trim();
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
}
