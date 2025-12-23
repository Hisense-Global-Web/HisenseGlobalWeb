/* eslint-disable no-console */

export default async function decorate(block) {
  const link = block.querySelector('a');
  const endpoint = link ? link.getAttribute('href').trim() : '';

  const skuEl = block.querySelector('p[data-aue-prop="sku"]')
    || Array.from(block.querySelectorAll('p'))[1]
    || block.querySelector('p');
  const sku = skuEl ? skuEl.textContent.trim() : '';

  console.log('pdp-product-info: endpoint =', endpoint, 'sku =', sku);

  if (!endpoint || !sku) return;

  const url = `${endpoint};sku=${encodeURIComponent(sku)}`;

  let json = null;
  try {
    const resp = await fetch(url);
    json = await resp.json();
  } catch (err) {
    console.error('pdp-product-info: failed to fetch product data, using mock', err);
    /* mock data */
    json = {
      data: {
        productModelList: {
          items: [
            {
              path: '/content/dam/hisense/ux00001116',
              sku: '75U65QF40',
              title: 'Hisense 75" Class U6 Series MiniLED ULED 4K Fire TV',
              size: '50"',
              series: '4K ULED',
              awards: [
                { path: '/content/dam/hisense/image/product/awards/CES_Picks_Awards_2025.png' },
                { path: '/content/dam/hisense/image/product/awards/IFA_2025Honoree.png' },
                { path: '/content/dam/hisense/image/product/awards/2025_Badge_CES.png' },
                { path: '/content/dam/hisense/image/product/awards/PC_MAG.png' },
              ],
              mediaGallery_image: { path: '/content/dam/hisense/image/product/75u65qf/991681.jpg' },
              mediaGallery_gallery: [
                { path: '/content/dam/hisense/image/product/75u65qf/1d7134_f14ac53a8722435883863f097da3f517~mv2.webp' },
                { path: '/content/dam/hisense/image/product/75u65qf/1d7134_a313ffc3cf5144448aaecdf2d695cff3~mv2.webp' },
                { path: '/content/dam/hisense/image/product/75u65qf/1d7134_deed81a4eda740b492c6d9d77e1a287e~mv2.webp' },
              ],
              priceInfo_currency: '$',
              priceInfo_regularPrice: 20000,
              whereToBuyLink: 'http://amazon.com/dp/B0DN6THH67?tag=psuni-01-US-6998-20&ascsubtag=wtbs_6945105b9a324f64010cda03&me=ATVPDKIKX0DER',
              tags: ['hisense:product/tv/screen-size/50'],
              variation: 'master',
            },
          ],
        },
      },
    };
  }

  const items = json && json.data && json.data.productModelList && json.data.productModelList.items;
  const product = items && items[0] ? items[0] : null;

  const info = document.createElement('div');
  info.className = 'pdp-info';

  const fav = document.createElement('div');
  fav.className = 'pdp-favorite';
  fav.textContent = '♡';
  info.appendChild(fav);

  const series = document.createElement('div');
  series.className = 'pdp-series';
  series.textContent = (product && product.series) ? product.series : '';
  info.appendChild(series);

  const title = document.createElement('h1');
  title.className = 'pdp-title';
  title.textContent = (product && product.title) ? product.title : '';
  info.appendChild(title);

  const sizesWrapper = document.createElement('div');
  sizesWrapper.className = 'pdp-sizes';
  const sizes = (product && product.size) ? String(product.size).split(',') : [];
  if (sizes.length) {
    sizes.forEach((s) => {
      const el = document.createElement('div');
      el.className = 'pdp-size';
      el.textContent = s.trim();
      sizesWrapper.appendChild(el);
    });
  }
  info.appendChild(sizesWrapper);

  const badges = document.createElement('div');
  badges.className = 'pdp-badges';
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
      badges.appendChild(b);
    });
  } else if (product && product.badge) {
    const b = document.createElement('div');
    b.className = 'pdp-badge';
    b.textContent = product.badge;
    badges.appendChild(b);
  }
  info.appendChild(badges);

  const buy = document.createElement('button');
  buy.className = 'pdp-buy-btn';
  buy.textContent = 'Where to buy';
  const buyLink = (product && (product.whereToBuyLink || product.productDetailPageLink)) || '';
  if (buyLink) {
    buy.addEventListener('click', () => { window.location.href = buyLink; });
  }
  info.appendChild(buy);

  const specsBtn = document.createElement('button');
  specsBtn.className = 'pdp-specs-btn';
  const specsImg = document.createElement('img');
  specsImg.src = 'left.svg';
  specsImg.alt = 'specs';
  specsBtn.appendChild(specsImg);
  const specsSpan = document.createElement('span');
  specsSpan.textContent = 'SPECS';
  specsBtn.appendChild(specsSpan);
  info.appendChild(specsBtn);

  block.replaceChildren(info);
}
