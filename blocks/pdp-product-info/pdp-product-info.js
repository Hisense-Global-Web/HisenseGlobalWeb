/* eslint-disable no-console */

export default async function decorate(block) {
  const rows = [...(block.children || [])];
  let fields = [];
  rows.forEach((row) => {
    const text = row.textContent && row.textContent.trim();
    if (text && text.indexOf(',') >= 0) {
      fields = text.split(',').map((s) => s.trim()).filter(Boolean);
    }
  });
  const link = block.querySelector('a');
  const endpoint = link ? link.getAttribute('href').trim() : '';

  const skuEl = block.querySelector('p[data-aue-prop="sku"]')
    || Array.from(block.querySelectorAll('p'))[1]
    || block.querySelector('p');
  const sku = skuEl ? skuEl.textContent.trim() : '';

  console.log('pdp-product-info: endpoint =', endpoint, 'sku =', sku);

  if (!endpoint || !sku) return;

  const url = `${endpoint}`;

  let json = null;
  try {
    const resp = await fetch(url);
    json = await resp.json();
  } catch (err) {
    console.error('pdp-product-info: failed to fetch product data, using mock', err);
    /* mock data */
    json = {
      total: 41,
      offset: 0,
      limit: 41,
      columns: [
        'sku',
        'spu',
        'erpcode',
        'title',
        'subtitle',
        'series',
        'description_description',
        'productLaunchDate',
        'tags',
        'mediaGallery_image',
      ],
      data: [
        {
          sku: '43A65H',
          spu: '43A65H',
          erpcode: null,
          title: 'Hisense 43" Class A6 Series LED 4K UHD Smart Google TV',
          subtitle: 'Hisense 43" Class A6 Series LED 4K UHD Smart Google TV',
          series: 'A6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 43&#34; Class A6 Series LED 4K UHD Smart Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/32-43',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a6-series/key-visual/a6.png',
          },
        },
        {
          sku: '55A65H',
          spu: '55A65H',
          erpcode: null,
          title: 'Hisense 55" Class A6 Series LED 4K UHD Smart Google TV',
          subtitle: 'Hisense 55" Class A6 Series LED 4K UHD Smart Google TV',
          series: 'A6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 55&#34; Class A6 Series LED 4K UHD Smart Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a6-series/key-visual/a6.png',
          },
        },
        {
          sku: '65A65H',
          spu: '65A65H',
          erpcode: null,
          title: 'Hisense 65" Class A6 Series LED 4K UHD Smart Google TV',
          subtitle: 'Hisense 65" Class A6 Series LED 4K UHD Smart Google TV',
          series: 'A6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 65&#34; Class A6 Series LED 4K UHD Smart Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a6-series/key-visual/a6.png',
          },
        },
        {
          sku: '50A65H',
          spu: '50A65H',
          erpcode: null,
          title: 'Hisense 50" Class A6 Series LED 4K UHD Smart Google TV',
          subtitle: 'Hisense 50" Class A6 Series LED 4K UHD Smart Google TV',
          series: 'A6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 50&#34; Class A6 Series LED 4K UHD Smart Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a6-series/key-visual/a6.png',
          },
        },
        {
          sku: '43A7N',
          spu: '43A7N',
          erpcode: null,
          title: 'Hisense 43" Class A7 Series LCD 4K Google TV',
          subtitle: 'Hisense 43" Class A7 Series LCD 4K Google TV',
          series: 'A7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 43&#34; Class A7 Series LCD 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-04-30T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/32-43',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a7-series/key-visual/a7.png',
          },
        },
        {
          sku: '50A7N',
          spu: '50A7N',
          erpcode: null,
          title: 'Hisense 50" Class A7 Series LCD 4K Google TV',
          subtitle: 'Hisense 50" Class A7 Series LCD 4K Google TV',
          series: 'A7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 50&#34; Class A7 Series LCD 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-04-30T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a7-series/key-visual/a7.png',
          },
        },
        {
          sku: '55A7N',
          spu: '55A7N',
          erpcode: null,
          title: 'Hisense 55" Class A7 Series LCD 4K Google TV',
          subtitle: 'Hisense 55" Class A7 Series LCD 4K Google TV',
          series: 'A7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 55&#34; Class A7 Series LCD 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-04-30T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a7-series/key-visual/a7.png',
          },
        },
        {
          sku: '65A7N',
          spu: '65A7N',
          erpcode: null,
          title: 'Hisense 65" Class A7 Series LCD 4K Google TV',
          subtitle: 'Hisense 65" Class A7 Series LCD 4K Google TV',
          series: 'A7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 65&#34; Class A7 Series LCD 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-04-30T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a7-series/key-visual/a7.png',
          },
        },
        {
          sku: '75A7N',
          spu: '75A7N',
          erpcode: null,
          title: 'Hisense 75" Class A7 Series LCD 4K Google TV',
          subtitle: 'Hisense 75" Class A7 Series LCD 4K Google TV',
          series: 'A7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 75&#34; Class A7 Series LCD 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-04-30T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a7-series/key-visual/a7.png',
          },
        },
        {
          sku: '85A7N',
          spu: '85A7N',
          erpcode: null,
          title: 'Hisense 85" Class A7 Series LCD 4K Google TV',
          subtitle: 'Hisense 85" Class A7 Series LCD 4K Google TV',
          series: 'A7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class A7 Series LCD 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-04-30T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/a7-series/key-visual/a7.png',
          },
        },
        {
          sku: '100QD7QF',
          spu: '100QD7QF',
          erpcode: null,
          title: 'MiniLED ULED 4K Fire TV',
          subtitle: 'MiniLED ULED 4K Fire TV',
          series: 'QD7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 100&#34; Class QD7 Series MiniLED ULED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/98-max',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd7-series/key-visual/qd7.png',
          },
        },
        {
          sku: '50QD7QF',
          spu: '50QD7QF',
          erpcode: null,
          title: 'MiniLED ULED 4K Fire TV',
          subtitle: 'MiniLED ULED 4K Fire TV',
          series: 'QD7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 50&#34; Class QD7 Series MiniLED ULED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd7-series/key-visual/qd7.png',
          },
        },
        {
          sku: '55QD7QF',
          spu: '55QD7QF',
          erpcode: null,
          title: 'MiniLED ULED 4K Fire TV',
          subtitle: 'MiniLED ULED 4K Fire TV',
          series: 'QD7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 55&#34; Class QD7 Series MiniLED ULED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd7-series/key-visual/qd7.png',
          },
        },
        {
          sku: '65QD7QF',
          spu: '65QD7QF',
          erpcode: null,
          title: 'MiniLED ULED 4K Fire TV',
          subtitle: 'MiniLED ULED 4K Fire TV',
          series: 'QD7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 65&#34; Class QD7 Series MiniLED ULED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd7-series/key-visual/qd7.png',
          },
        },
        {
          sku: '75QD7QF',
          spu: '75QD7QF',
          erpcode: null,
          title: 'MiniLED ULED 4K Fire TV',
          subtitle: 'MiniLED ULED 4K Fire TV',
          series: 'QD7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 75&#34; Class QD7 Series MiniLED ULED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd7-series/key-visual/qd7.png',
          },
        },
        {
          sku: '85QD7QF',
          spu: '85QD7QF',
          erpcode: null,
          title: 'MiniLED ULED 4K Fire TV',
          subtitle: 'MiniLED ULED 4K Fire TV',
          series: 'QD7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class QD7 Series MiniLED ULED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/fire-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd7-series/key-visual/qd7.png',
          },
        },
        {
          sku: '100QD6QF',
          spu: '100QD6QF',
          erpcode: null,
          title: 'Hisense 100" Class QD6 Series Hi-QLED 4K Fire TV',
          subtitle: 'Hisense 100" Class QD6 Series Hi-QLED 4K Fire TV',
          series: 'QD6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 100&#34; Class QD6 Series Hi-QLED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/98-max',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd6-series/key-visual/qd6.png',
          },
        },
        {
          sku: '43QD6QF',
          spu: '43QD6QF',
          erpcode: null,
          title: 'Hisense 43" Class QD6 Series Hi-QLED 4K Fire TV',
          subtitle: 'Hisense 43" Class QD6 Series Hi-QLED 4K Fire TV',
          series: 'QD6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 43&#34; Class QD6 Series Hi-QLED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/32-43',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd6-series/key-visual/qd6.png',
          },
        },
        {
          sku: '50QD6QF',
          spu: '50QD6QF',
          erpcode: null,
          title: 'Hisense 50" Class QD6 Series Hi-QLED 4K Fire TV',
          subtitle: 'Hisense 50" Class QD6 Series Hi-QLED 4K Fire TV',
          series: 'QD6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 50&#34; Class QD6 Series Hi-QLED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd6-series/key-visual/qd6.png',
          },
        },
        {
          sku: '55QD6QF',
          spu: '55QD6QF',
          erpcode: null,
          title: 'Hisense 55" Class QD6 Series Hi-QLED 4K Fire TV',
          subtitle: 'Hisense 55" Class QD6 Series Hi-QLED 4K Fire TV',
          series: 'QD6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 55&#34; Class QD6 Series Hi-QLED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd6-series/key-visual/qd6.png',
          },
        },
        {
          sku: '65QD6QF',
          spu: '65QD6QF',
          erpcode: null,
          title: 'Hisense 65" Class QD6 Series Hi-QLED 4K Fire TV',
          subtitle: 'Hisense 65" Class QD6 Series Hi-QLED 4K Fire TV',
          series: 'QD6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 65&#34; Class QD6 Series Hi-QLED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: null,
        },
        {
          sku: '75QD6QF',
          spu: '75QD6QF',
          erpcode: null,
          title: 'Hisense 75" Class QD6 Series Hi-QLED 4K Fire TV',
          subtitle: 'Hisense 75" Class QD6 Series Hi-QLED 4K Fire TV',
          series: 'QD6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 75&#34; Class QD6 Series Hi-QLED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd6-series/key-visual/qd6.png',
          },
        },
        {
          sku: '85QD6QF',
          spu: '85QD6QF',
          erpcode: null,
          title: 'Hisense 85" Class QD6 Series Hi-QLED 4K Fire TV',
          subtitle: 'Hisense 85" Class QD6 Series Hi-QLED 4K Fire TV',
          series: 'QD6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class QD6 Series Hi-QLED 4K Fire TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/lcd-led',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/qd6-series/key-visual/qd6.png',
          },
        },
        {
          sku: '55U6N',
          spu: '55U6N',
          erpcode: null,
          title: 'Hisense 55" Class U6 Series Mini-LED ULED 4K Google TV',
          subtitle: 'Hisense 55" Class U6 Series Mini-LED ULED 4K Google TV',
          series: 'U6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 55&#34; Class U6 Series Mini-LED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-02-28T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u6-series/key-visual/u6.png',
          },
        },
        {
          sku: '65U6N',
          spu: '65U6N',
          erpcode: null,
          title: 'Hisense 65" Class U6 Series Mini-LED ULED 4K Google TV',
          subtitle: 'Hisense 65" Class U6 Series Mini-LED ULED 4K Google TV',
          series: 'U6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 65&#34; Class U6 Series Mini-LED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-02-28T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u6-series/key-visual/u6.png',
          },
        },
        {
          sku: '75U6N',
          spu: '75U6N',
          erpcode: null,
          title: 'Hisense 75" Class U6 Series Mini-LED ULED 4K Google TV',
          subtitle: 'Hisense 75" Class U6 Series Mini-LED ULED 4K Google TV',
          series: 'U6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 75&#34; Class U6 Series Mini-LED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-02-28T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u6-series/key-visual/u6.png',
          },
        },
        {
          sku: '85U6N',
          spu: '85U6N',
          erpcode: null,
          title: 'Hisense 85" Class U6 Series Mini-LED ULED 4K Google TV',
          subtitle: 'Hisense 85" Class U6 Series Mini-LED ULED 4K Google TV',
          series: 'U6 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class U6 Series Mini-LED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-02-28T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/60hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u6-series/key-visual/u6.png',
          },
        },
        {
          sku: '100U75QG',
          spu: '100U75QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 100&#34; Class U7 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/98-max',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u7-serises/key-visual/u7.png',
          },
        },
        {
          sku: '116U75QG',
          spu: '116U75QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 116&#34; Class U7 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/98-max',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u7-serises/key-visual/u7.png',
          },
        },
        {
          sku: '55U75QG',
          spu: '55U75QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 55&#34; Class U7 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u7-serises/key-visual/u7.png',
          },
        },
        {
          sku: '75U75QG',
          spu: '75U75QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 75&#34; Class U7 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u7-serises/key-visual/u7.png',
          },
        },
        {
          sku: '85U75QG',
          spu: '85U75QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class U7 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u7-serises/key-visual/u7.png',
          },
        },
        {
          sku: '65U75QG',
          spu: '65U75QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U7 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 65&#34; Class U7 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/type/miniled',
            'hisense:product/tv/screen-size/50-65',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u7-serises/key-visual/u7.png',
          },
        },
        {
          sku: '100U8QG',
          spu: '100U8QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U8 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/98-max',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u8-serises/key-visual/u8.png',
          },
        },
        {
          sku: '65U8QG',
          spu: '65U8QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U8 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 65&#34; Class U8 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u8-serises/key-visual/u8.png',
          },
        },
        {
          sku: '75U8QG',
          spu: '75U8QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U8 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 75&#34; Class U8 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u8-serises/key-visual/u8.png',
          },
        },
        {
          sku: '85U8QG',
          spu: '85U8QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U8 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u8-serises/key-visual/u8.png',
          },
        },
        {
          sku: '55U8QG',
          spu: '55U8QG',
          erpcode: null,
          title: 'MiniLED ULED 4K Google TV',
          subtitle: 'MiniLED ULED 4K Google TV',
          series: 'U8 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-03-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/50-65',
            'hisense:product/tv/type/miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u8-serises/key-visual/u8.png',
          },
        },
        {
          sku: '75U9N',
          spu: '75U9N',
          erpcode: null,
          title: 'Hisense 75" Class U9 Series Mini-LED QLED 4K Google TV',
          subtitle: 'Hisense 75" Class U9 Series Mini-LED QLED 4K Google TV',
          series: 'U9 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 75&#34; Class U9 Series Mini-LED QLED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-05-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
            'hisense:product/tv/type/hi-qled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u9-series/key-visual/u9.png',
          },
        },
        {
          sku: '85U9N',
          spu: '85U9N',
          erpcode: null,
          title: 'Hisense 85" Class U9 Series Mini-LED QLED 4K Google TV',
          subtitle: 'Hisense 85" Class U9 Series Mini-LED QLED 4K Google TV',
          series: 'U9 Series',
          description_description: {
            html: '\u003Cp\u003EHisense 85&#34; Class U9 Series Mini-LED QLED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-05-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/144hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/screen-size/70-85',
            'hisense:product/tv/type/miniled',
            'hisense:product/tv/type/hi-qled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/u9-series/key-visual/u9.png',
          },
        },
        {
          sku: '116UXQUA',
          spu: '116UXQUA',
          erpcode: null,
          title: 'RGB MiniLED ULED 4K Google TV',
          subtitle: 'RGB MiniLED ULED 4K Google TV',
          series: 'UX Series',
          description_description: {
            html: '\u003Cp\u003EHisense 116” Class UX Series RGB MiniLEDULED 4K Google TV\u003C/p\u003E',
          },
          productLaunchDate: '2025-05-31T16:00:00.000Z',
          tags: [
            'hisense:product/tv/screen-size/98-max',
            'hisense:product/tv/operating-system/google-tv',
            'hisense:product/tv/refresh-rate/165hz',
            'hisense:product/tv/resolution/uhd',
            'hisense:product/tv/type/rgb-miniled',
          ],
          mediaGallery_image: {
            _path: '/content/dam/hisense/us/products/televisions/ux-serises/key-visual/ux.png',
          },
        },
      ],
      ':type': 'sheet',
    };
  }

  let items = null;
  if (json && json.data) {
    if (json.data.productModelList && json.data.productModelList.items) {
      items = json.data.productModelList.items;
    } else if (Array.isArray(json.data)) {
      items = json.data;
    }
  }
  // 根据SKU找到对应的产品
  const currentProduct = items ? items.find((item) => item.sku === sku) : null;
  const product = currentProduct || (items && items[0] ? items[0] : null);

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
  likeEmpty.src = '/content/dam/hisense/image/icon/like-empty.svg';
  fav.appendChild(likeEmpty);
  const like = document.createElement('img');
  like.src = '/content/dam/hisense/image/icon/like.svg';
  fav.appendChild(like);
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
  if (similarProducts.length > 0) {
    // 对尺寸进行升序排序
    const sortedProducts = similarProducts.sort((a, b) => {
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

  const specsBtn = document.createElement('div');
  specsBtn.className = 'pdp-specs-btn';
  const specsImg = document.createElement('img');
  specsImg.src = '/content/dam/hisense/us/common-icons/specs.svg';
  specsImg.alt = 'specs';
  specsBtn.appendChild(specsImg);
  const specsSpan = document.createElement('span');
  specsSpan.textContent = 'SPECS';
  specsBtn.appendChild(specsSpan);
  if (!fields.includes('position')) {
    specsBtn.classList.add('hide');
  }
  specsBtn.addEventListener('click', () => {
    const targetElement = document.getElementById('specifications');
    if (!targetElement) {
      return;
    }
    const targetPosition = targetElement.getBoundingClientRect().top;
    window.scrollTo({
      top: targetPosition,
      behavior: 'auto',
    });
  });

  info.appendChild(specsBtn);

  block.replaceChildren(info);
}
