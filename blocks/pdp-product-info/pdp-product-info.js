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
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/100QD6QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '100QD6QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '100QD6QF',
              spu: '100QD6QF',
              erpcode: null,
              overseasModel: 'QD6',
              factoryModel: 'QD6QF',
              badge: null,
              awards: [],
              title: 'Hisense 100" Class QD6 Series Hi-QLED 4K Fire TV',
              subtitle: 'Hisense 100" Class QD6 Series Hi-QLED 4K Fire TV',
              series: 'QD6 Series',
              platform: null,
              size: '100',
              description_description: {
                html: '<p>Hisense 100&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ba8c69e4a99494db44ac1f5f34d14e6be612bc7b.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/Q6D.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-100-class-qd6-series-hi-qled-4k-fire-tv-100qd6qf',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/98-max',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/100QD7QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '100QD7QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '100QD7QF',
              spu: '100QD7QF',
              erpcode: null,
              overseasModel: 'QD7',
              factoryModel: 'QD7QF',
              badge: null,
              awards: [],
              title: 'Hisense 100" Class QD7 Series MiniLED ULED 4K Fire TV',
              subtitle: 'Hisense 100" Class QD7 Series MiniLED ULED 4K Fire TV',
              series: 'QD7 Series',
              platform: null,
              size: '100',
              description_description: {
                html: '<p>Hisense 100&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15d30053666c82aca8e732d92feef300aa4533def.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/QD7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-75-class-qd7-series-miniled-uled-4k-fire-tv-75qd7qf',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/98-max',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/116U75QG-100',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '100U75QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '100U75QG',
              spu: '100U75QG',
              erpcode: null,
              overseasModel: 'U7',
              factoryModel: 'U75QG',
              badge: null,
              awards: [],
              title: 'Hisense 100" Class U7 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 100" Class U7 Series MiniLED ULED 4K Google TV',
              series: 'U7 Series',
              platform: null,
              size: '100',
              description_description: {
                html: '<p>Hisense 100&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_13903e11ba6f8c37503b3876bab276ca5de5f2cf8.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://development--hisenseglobalweb--hisense-global-web.aem.live/ui-testing/100U75QG',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/98-max',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/116U75QG-116',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '116U75QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '116U75QG',
              spu: '116U75QG',
              erpcode: null,
              overseasModel: 'U7',
              factoryModel: 'U75QG',
              badge: null,
              awards: [],
              title: 'Hisense 116" Class U7 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 116" Class U7 Series MiniLED ULED 4K Google TV',
              series: 'U7 Series',
              platform: null,
              size: '116',
              description_description: {
                html: '<p>Hisense 116&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_13903e11ba6f8c37503b3876bab276ca5de5f2cf8.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/98-max',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/116U75QG-55',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '55U75QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '55U75QG',
              spu: '55U75QG',
              erpcode: null,
              overseasModel: 'U7',
              factoryModel: 'U75QG',
              badge: null,
              awards: [],
              title: 'Hisense 55" Class U7 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 55" Class U7 Series MiniLED ULED 4K Google TV',
              series: 'U7 Series',
              platform: null,
              size: '55',
              description_description: {
                html: '<p>Hisense 55&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_13903e11ba6f8c37503b3876bab276ca5de5f2cf8.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/116U75QG-75',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '75U75QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '75U75QG',
              spu: '75U75QG',
              erpcode: null,
              overseasModel: 'U7',
              factoryModel: 'U75QG',
              badge: null,
              awards: [],
              title: 'Hisense 75" Class U7 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 75" Class U7 Series MiniLED ULED 4K Google TV',
              series: 'U7 Series',
              platform: null,
              size: '75',
              description_description: {
                html: '<p>Hisense 75&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_13903e11ba6f8c37503b3876bab276ca5de5f2cf8.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/116U75QG-85',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '85U75QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '85U75QG',
              spu: '85U75QG',
              erpcode: null,
              overseasModel: 'U7',
              factoryModel: 'U75QG',
              badge: null,
              awards: [],
              title: 'Hisense 85" Class U7 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 85" Class U7 Series MiniLED ULED 4K Google TV',
              series: 'U7 Series',
              platform: null,
              size: '85',
              description_description: {
                html: '<p>Hisense 85&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_13903e11ba6f8c37503b3876bab276ca5de5f2cf8.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/43A65H',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '43A65H',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '43A65H',
              spu: '43A65H',
              erpcode: null,
              overseasModel: 'A6',
              factoryModel: 'A65H',
              badge: null,
              awards: [],
              title: 'Hisense 43" Class A6 Series LED 4K UHD Smart Google TV',
              subtitle: 'Hisense 43" Class A6 Series LED 4K UHD Smart Google TV',
              series: 'A6 Series',
              platform: null,
              size: '43',
              description_description: {
                html: '<p>Hisense 43&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_11cf4947decc4e0af4e2ca34f224af966609df800.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/32-43',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/43A7N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '43A7N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '43A7N',
              spu: '43A7N',
              erpcode: null,
              overseasModel: 'A7',
              factoryModel: 'A7N',
              badge: null,
              awards: [],
              title: 'Hisense 43" Class A7 Series LCD 4K Google TV',
              subtitle: 'Hisense 43" Class A7 Series LCD 4K Google TV',
              series: 'A7 Series',
              platform: '9603',
              size: '43',
              description_description: {
                html: '<p>Hisense 43&#34; Class A7 Series LCD 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15172509ddaadbbc04cb51e386363adb19ec2d9ca.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                'us',
              ],
              productLaunchDate: '2025-04-30T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/32-43',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/43QD6QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '43QD6QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '43QD6QF',
              spu: '43QD6QF',
              erpcode: null,
              overseasModel: 'QD6',
              factoryModel: 'QD6QF',
              badge: null,
              awards: [],
              title: 'Hisense 43" Class QD6 Series Hi-QLED 4K Fire TV',
              subtitle: 'Hisense 43" Class QD6 Series Hi-QLED 4K Fire TV',
              series: 'QD6 Series',
              platform: null,
              size: '43',
              description_description: {
                html: '<p>Hisense 43&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ba8c69e4a99494db44ac1f5f34d14e6be612bc7b.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/Q6D.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/32-43',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/50A7N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '50A7N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '50A7N',
              spu: '50A7N',
              erpcode: null,
              overseasModel: 'A7',
              factoryModel: 'A7N',
              badge: null,
              awards: [],
              title: 'Hisense 50" Class A7 Series LCD 4K Google TV',
              subtitle: 'Hisense 50" Class A7 Series LCD 4K Google TV',
              series: 'A7 Series',
              platform: '9603',
              size: '50',
              description_description: {
                html: '<p>Hisense 50&#34; Class A7 Series LCD 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15172509ddaadbbc04cb51e386363adb19ec2d9ca.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                'us',
              ],
              productLaunchDate: '2025-04-30T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/50QD6QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '50QD6QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '50QD6QF',
              spu: '50QD6QF',
              erpcode: null,
              overseasModel: 'QD6',
              factoryModel: 'QD6QF',
              badge: null,
              awards: [],
              title: 'Hisense 50" Class QD6 Series Hi-QLED 4K Fire TV',
              subtitle: 'Hisense 50" Class QD6 Series Hi-QLED 4K Fire TV',
              series: 'QD6 Series',
              platform: null,
              size: '50',
              description_description: {
                html: '<p>Hisense 50&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ba8c69e4a99494db44ac1f5f34d14e6be612bc7b.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/Q6D.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/50QD7QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '50QD7QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '50QD7QF',
              spu: '50QD7QF',
              erpcode: null,
              overseasModel: 'QD7',
              factoryModel: 'QD7QF',
              badge: null,
              awards: [],
              title: 'Hisense 50" Class QD7 Series MiniLED ULED 4K Fire TV',
              subtitle: 'Hisense 50" Class QD7 Series MiniLED ULED 4K Fire TV',
              series: 'QD7 Series',
              platform: null,
              size: '50',
              description_description: {
                html: '<p>Hisense 50&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15d30053666c82aca8e732d92feef300aa4533def.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/QD7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/55A65H',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '55A65H',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '55A65H',
              spu: '55A65H',
              erpcode: null,
              overseasModel: 'A6',
              factoryModel: 'A65H',
              badge: null,
              awards: [],
              title: 'Hisense 55" Class A6 Series LED 4K UHD Smart Google TV',
              subtitle: 'Hisense 55" Class A6 Series LED 4K UHD Smart Google TV',
              series: 'A6 Series',
              platform: null,
              size: '55',
              description_description: {
                html: '<p>Hisense 55&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_11cf4947decc4e0af4e2ca34f224af966609df800.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/55A7N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '55A7N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '55A7N',
              spu: '55A7N',
              erpcode: null,
              overseasModel: 'A7',
              factoryModel: 'A7N',
              badge: null,
              awards: [],
              title: 'Hisense 55" Class A7 Series LCD 4K Google TV',
              subtitle: 'Hisense 55" Class A7 Series LCD 4K Google TV',
              series: 'A7 Series',
              platform: '9603',
              size: '55',
              description_description: {
                html: '<p>Hisense 55&#34; Class A7 Series LCD 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15172509ddaadbbc04cb51e386363adb19ec2d9ca.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                'us',
              ],
              productLaunchDate: '2025-04-30T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/55QD6QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '55QD6QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '55QD6QF',
              spu: '55QD6QF',
              erpcode: null,
              overseasModel: 'QD6',
              factoryModel: 'QD6QF',
              badge: null,
              awards: [],
              title: 'Hisense 55" Class QD6 Series Hi-QLED 4K Fire TV',
              subtitle: 'Hisense 55" Class QD6 Series Hi-QLED 4K Fire TV',
              series: 'QD6 Series',
              platform: null,
              size: '55',
              description_description: {
                html: '<p>Hisense 55&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ba8c69e4a99494db44ac1f5f34d14e6be612bc7b.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/Q6D.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/55QD7QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '55QD7QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '55QD7QF',
              spu: '55QD7QF',
              erpcode: null,
              overseasModel: 'QD7',
              factoryModel: 'QD7QF',
              badge: null,
              awards: [],
              title: 'Hisense 55" Class QD7 Series MiniLED ULED 4K Fire TV',
              subtitle: 'Hisense 55" Class QD7 Series MiniLED ULED 4K Fire TV',
              series: 'QD7 Series',
              platform: null,
              size: '55',
              description_description: {
                html: '<p>Hisense 55&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15d30053666c82aca8e732d92feef300aa4533def.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/QD7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-75-class-qd7-series-miniled-uled-4k-fire-tv-75qd7qf',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65A65H',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '65A65H',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '65A65H',
              spu: '65A65H',
              erpcode: null,
              overseasModel: 'A6',
              factoryModel: 'A65H',
              badge: null,
              awards: [],
              title: 'Hisense 65" Class A6 Series LED 4K UHD Smart Google TV',
              subtitle: 'Hisense 65" Class A6 Series LED 4K UHD Smart Google TV',
              series: 'A6 Series',
              platform: null,
              size: '65',
              description_description: {
                html: '<p>/media_11cf4947decc4e0af4e2ca34f224af966609df800.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              description_shortDescription: {
                html: '<p>/media_11cf4947decc4e0af4e2ca34f224af966609df800.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-65-inch-a6-series-led-4k-uhd-smart-google-tv-2021-65a65h',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65A7N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '65A7N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '65A7N',
              spu: '65A7N',
              erpcode: null,
              overseasModel: 'A7',
              factoryModel: 'A7N',
              badge: null,
              awards: [],
              title: 'Hisense 65" Class A7 Series LCD 4K Google TV',
              subtitle: 'Hisense 65" Class A7 Series LCD 4K Google TV',
              series: 'A7 Series',
              platform: '9603',
              size: '65',
              description_description: {
                html: '<p>Hisense 65&#34; Class A7 Series LCD 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15172509ddaadbbc04cb51e386363adb19ec2d9ca.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                'us',
              ],
              productLaunchDate: '2025-04-30T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65QD6QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '65QD6QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '65QD6QF',
              spu: '65QD6QF',
              erpcode: null,
              overseasModel: 'QD6',
              factoryModel: 'QD6QF',
              badge: null,
              awards: [],
              title: 'Hisense 65" Class QD6 Series Hi-QLED 4K Fire TV',
              subtitle: 'Hisense 65" Class QD6 Series Hi-QLED 4K Fire TV',
              series: 'QD6 Series',
              platform: null,
              size: '65',
              description_description: {
                html: '<p>Hisense 65&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ba8c69e4a99494db44ac1f5f34d14e6be612bc7b.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/Q6D.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65QD7QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '65QD7QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '65QD7QF',
              spu: '65QD7QF',
              erpcode: null,
              overseasModel: 'QD7',
              factoryModel: 'QD7QF',
              badge: null,
              awards: [],
              title: 'Hisense 65" Class QD7 Series MiniLED ULED 4K Fire TV',
              subtitle: 'Hisense 65" Class QD7 Series MiniLED ULED 4K Fire TV',
              series: 'QD7 Series',
              platform: null,
              size: '65',
              description_description: {
                html: '<p>Hisense 65&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15d30053666c82aca8e732d92feef300aa4533def.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/QD7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65U6N-55',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '55U6N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '55U6N',
              spu: '55U6N',
              erpcode: null,
              overseasModel: 'U6',
              factoryModel: 'U6N',
              badge: null,
              awards: [],
              title: 'Hisense 55" Class U6 Series Mini-LED ULED 4K Google TV',
              subtitle: 'Hisense 55" Class U6 Series Mini-LED ULED 4K Google TV',
              series: 'U6 Series',
              platform: null,
              size: '55',
              description_description: {
                html: '<p>Hisense 55&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1daff38faa46990099b5c1af202149471c14f7872.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-02-28T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65U6N-65',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '65U6N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '65U6N',
              spu: '65U6N',
              erpcode: null,
              overseasModel: 'U6',
              factoryModel: 'U6N',
              badge: null,
              awards: [],
              title: 'Hisense 65" Class U6 Series Mini-LED ULED 4K Google TV',
              subtitle: 'Hisense 65" Class U6 Series Mini-LED ULED 4K Google TV',
              series: 'U6 Series',
              platform: null,
              size: '65',
              description_description: {
                html: '<p>Hisense 65&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1daff38faa46990099b5c1af202149471c14f7872.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-02-28T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65U6N-75',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '75U6N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '75U6N',
              spu: '75U6N',
              erpcode: null,
              overseasModel: 'U6',
              factoryModel: 'U6N',
              badge: null,
              awards: [],
              title: 'Hisense 75" Class U6 Series Mini-LED ULED 4K Google TV',
              subtitle: 'Hisense 75" Class U6 Series Mini-LED ULED 4K Google TV',
              series: 'U6 Series',
              platform: null,
              size: '75',
              description_description: {
                html: '<p>Hisense 75&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1daff38faa46990099b5c1af202149471c14f7872.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-02-28T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65U6N-85',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '85U6N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '85U6N',
              spu: '85U6N',
              erpcode: null,
              overseasModel: 'U6',
              factoryModel: 'U6N',
              badge: null,
              awards: [],
              title: 'Hisense 85" Class U6 Series Mini-LED ULED 4K Google TV',
              subtitle: 'Hisense 85" Class U6 Series Mini-LED ULED 4K Google TV',
              series: 'U6 Series',
              platform: null,
              size: '85',
              description_description: {
                html: '<p>Hisense 85&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1daff38faa46990099b5c1af202149471c14f7872.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-02-28T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-65-class-u6-series-mini-led-uled-4k-google-tv-65u6n',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/65U75QG',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '65U75QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '65U75QG',
              spu: '65U75QG',
              erpcode: null,
              overseasModel: 'U7',
              factoryModel: 'U75QG',
              badge: null,
              awards: [],
              title: 'Hisense 65" Class U7 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 65" Class U7 Series MiniLED ULED 4K Google TV',
              series: 'U7 Series',
              platform: null,
              size: '65',
              description_description: {
                html: '<p>Hisense 65&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_13903e11ba6f8c37503b3876bab276ca5de5f2cf8.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/type/miniled',
                'hisense:product/tv/screen-size/50-65',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/75A7N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '75A7N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '75A7N',
              spu: '75A7N',
              erpcode: null,
              overseasModel: 'A7',
              factoryModel: 'A7N',
              badge: null,
              awards: [],
              title: 'Hisense 75" Class A7 Series LCD 4K Google TV',
              subtitle: 'Hisense 75" Class A7 Series LCD 4K Google TV',
              series: 'A7 Series',
              platform: '9603',
              size: '75',
              description_description: {
                html: '<p>Hisense 75&#34; Class A7 Series LCD 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15172509ddaadbbc04cb51e386363adb19ec2d9ca.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                'us',
              ],
              productLaunchDate: '2025-04-30T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/75QD6QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '75QD6QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '75QD6QF',
              spu: '75QD6QF',
              erpcode: null,
              overseasModel: 'QD6',
              factoryModel: 'QD6QF',
              badge: null,
              awards: [],
              title: 'Hisense 75" Class QD6 Series Hi-QLED 4K Fire TV',
              subtitle: 'Hisense 75" Class QD6 Series Hi-QLED 4K Fire TV',
              series: 'QD6 Series',
              platform: null,
              size: '75',
              description_description: {
                html: '<p>Hisense 75&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ba8c69e4a99494db44ac1f5f34d14e6be612bc7b.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/Q6D.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/75QD7QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '75QD7QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '75QD7QF',
              spu: '75QD7QF',
              erpcode: null,
              overseasModel: 'QD7',
              factoryModel: 'QD7QF',
              badge: null,
              awards: [],
              title: 'Hisense 75" Class QD7 Series MiniLED ULED 4K Fire TV',
              subtitle: 'Hisense 75" Class QD7 Series MiniLED ULED 4K Fire TV',
              series: 'QD7 Series',
              platform: null,
              size: '75',
              description_description: {
                html: '<p>Hisense 75&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15d30053666c82aca8e732d92feef300aa4533def.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/QD7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/75U9N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '75U9N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '75U9N',
              spu: '75U9N',
              erpcode: null,
              overseasModel: 'U9',
              factoryModel: 'U9N',
              badge: null,
              awards: [],
              title: 'Hisense 75" Class U9 Series Mini-LED QLED 4K Google TV',
              subtitle: 'Hisense 75" Class U9 Series Mini-LED QLED 4K Google TV',
              series: 'U9 Series',
              platform: null,
              size: '75',
              description_description: {
                html: '<p>Hisense 75&#34; Class U9 Series Mini-LED QLED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ab3500b3226371493618815e7e8d3f9ae3783a44.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-05-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U9.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
                'hisense:product/tv/type/hi-qled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85A7N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '85A7N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '85A7N',
              spu: '85A7N',
              erpcode: null,
              overseasModel: 'A7',
              factoryModel: 'A7N',
              badge: null,
              awards: [],
              title: 'Hisense 85" Class A7 Series LCD 4K Google TV',
              subtitle: 'Hisense 85" Class A7 Series LCD 4K Google TV',
              series: 'A7 Series',
              platform: '9603',
              size: '85',
              description_description: {
                html: '<p>Hisense 85&#34; Class A7 Series LCD 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15172509ddaadbbc04cb51e386363adb19ec2d9ca.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                'us',
              ],
              productLaunchDate: '2025-04-30T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-55-class-a7-series-4k-wide-color-gamut-google-tv-55a7n',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85QD6QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '85QD6QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '85QD6QF',
              spu: '85QD6QF',
              erpcode: null,
              overseasModel: 'QD6',
              factoryModel: 'QD6QF',
              badge: null,
              awards: [],
              title: 'Hisense 85" Class QD6 Series Hi-QLED 4K Fire TV',
              subtitle: 'Hisense 85" Class QD6 Series Hi-QLED 4K Fire TV',
              series: 'QD6 Series',
              platform: null,
              size: '85',
              description_description: {
                html: '<p>Hisense 85&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ba8c69e4a99494db44ac1f5f34d14e6be612bc7b.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/Q6D.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85QD7QF',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '85QD7QF',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '85QD7QF',
              spu: '85QD7QF',
              erpcode: null,
              overseasModel: 'QD7',
              factoryModel: 'QD7QF',
              badge: null,
              awards: [],
              title: 'Hisense 85" Class QD7 Series MiniLED ULED 4K Fire TV',
              subtitle: 'Hisense 85" Class QD7 Series MiniLED ULED 4K Fire TV',
              series: 'QD7 Series',
              platform: null,
              size: '85',
              description_description: {
                html: '<p>Hisense 85&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_15d30053666c82aca8e732d92feef300aa4533def.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/QD7.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85U8QG-100',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '100U8QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '100U8QG',
              spu: '100U8QG',
              erpcode: null,
              overseasModel: 'U8',
              factoryModel: 'U8QG',
              badge: null,
              awards: [],
              title: 'Hisense 100" Class U8 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 100" Class U8 Series MiniLED ULED 4K Google TV',
              series: 'U8 Series',
              platform: null,
              size: '100',
              description_description: {
                html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_19a98f18d19b80532b872895a085840e915f28ba3.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U8.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/98-max',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85U8QG-65',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '65U8QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '65U8QG',
              spu: '65U8QG',
              erpcode: null,
              overseasModel: 'U8',
              factoryModel: 'U8QG',
              badge: null,
              awards: [],
              title: 'Hisense 65" Class U8 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 65" Class U8 Series MiniLED ULED 4K Google TV',
              series: 'U8 Series',
              platform: null,
              size: '65',
              description_description: {
                html: '<p>Hisense 65&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_19a98f18d19b80532b872895a085840e915f28ba3.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U8.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85U8QG-75',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '75U8QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '75U8QG',
              spu: '75U8QG',
              erpcode: null,
              overseasModel: 'U8',
              factoryModel: 'U8QG',
              badge: null,
              awards: [],
              title: 'Hisense 75" Class U8 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 75" Class U8 Series MiniLED ULED 4K Google TV',
              series: 'U8 Series',
              platform: null,
              size: '75',
              description_description: {
                html: '<p>Hisense 75&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_19a98f18d19b80532b872895a085840e915f28ba3.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U8.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85U8QG-85',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '85U8QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '85U8QG',
              spu: '85U8QG',
              erpcode: null,
              overseasModel: 'U8',
              factoryModel: 'U8QG',
              badge: null,
              awards: [],
              title: 'Hisense 85" Class U8 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 85" Class U8 Series MiniLED ULED 4K Google TV',
              series: 'U8 Series',
              platform: null,
              size: '85',
              description_description: {
                html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_19a98f18d19b80532b872895a085840e915f28ba3.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U8.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://development--hisenseglobalweb--hisense-global-web.aem.live/ui-testing/85U8QG',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85U8QG116-55',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '55U8QG',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '55U8QG',
              spu: '55U8QG',
              erpcode: null,
              overseasModel: 'U8',
              factoryModel: 'U8QG',
              badge: null,
              awards: [],
              title: 'Hisense 55" Class U8 Series MiniLED ULED 4K Google TV',
              subtitle: 'Hisense 55" Class U8 Series MiniLED ULED 4K Google TV',
              series: 'U8 Series',
              platform: null,
              size: '55',
              description_description: {
                html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_19a98f18d19b80532b872895a085840e915f28ba3.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U8.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/85U9N',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '85U9N',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '85U9N',
              spu: '85U9N',
              erpcode: null,
              overseasModel: 'U9',
              factoryModel: 'U9N',
              badge: null,
              awards: [],
              title: 'Hisense 85" Class U9 Series Mini-LED QLED 4K Google TV',
              subtitle: 'Hisense 85" Class U9 Series Mini-LED QLED 4K Google TV',
              series: 'U9 Series',
              platform: null,
              size: '85',
              description_description: {
                html: '<p>Hisense 85&#34; Class U9 Series Mini-LED QLED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1ab3500b3226371493618815e7e8d3f9ae3783a44.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-05-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/U9.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-75-class-u9-series-mini-led-qled-4k-google-tv-75u9n',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/144hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/70-85',
                'hisense:product/tv/type/miniled',
                'hisense:product/tv/type/hi-qled',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/copy-of-43-a-65-h',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '50A65H',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '50A65H',
              spu: '50A65H',
              erpcode: null,
              overseasModel: 'A6',
              factoryModel: 'A65H',
              badge: null,
              awards: [],
              title: 'Hisense 50" Class A6 Series LED 4K UHD Smart Google TV',
              subtitle: 'Hisense 50" Class A6 Series LED 4K UHD Smart Google TV',
              series: 'A6 Series',
              platform: null,
              size: '50',
              description_description: {
                html: '<p>Hisense 50&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_11cf4947decc4e0af4e2ca34f224af966609df800.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-03-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/A6.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: null,
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/operating-system/fire-tv',
                'hisense:product/tv/refresh-rate/60hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/screen-size/50-65',
                'hisense:product/tv/type/lcd-led',
              ],
              productVideos: null,
              _variation: 'master',
            },
            {
              _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/ux-rgb-116-ux',
              _metadata: {
                stringMetadata: [
                  {
                    name: 'title',
                    value: '116UXQUA',
                  },
                  {
                    name: 'description',
                    value: '',
                  },
                  {
                    name: 'cq:lastReplicationAction',
                    value: 'Activate',
                  },
                ],
              },
              sku: '116UXQUA',
              spu: '116UXQUA',
              erpcode: null,
              overseasModel: '116UXQUA',
              factoryModel: '116UXQUA',
              badge: null,
              awards: [],
              title: 'Hisense 116” Class UX Series RGB MiniLEDULED 4K Google TV',
              subtitle: 'Hisense 116” Class UX Series RGB MiniLEDULED 4K Google TV',
              series: 'UX Series',
              platform: null,
              size: '116',
              description_description: {
                html: '<p>Hisense 116” Class UX Series RGB MiniLEDULED 4K Google TV</p>',
              },
              description_shortDescription: {
                html: '<p>/media_1083106d6f7240773743c226c6638293c5385b98e.png?width=750&amp;format=png&amp;optimize=medium</p>',
              },
              enabled: true,
              launchingCountries: [
                '',
              ],
              productLaunchDate: '2025-05-31T16:00:00.000Z',
              productEndOfLifeDate: null,
              mediaGallery_image: {
                _path: '/content/dam/hisense/02-plp/UX.png',
              },
              mediaGallery_gallery: [],
              mediaGallery_mobileImage: null,
              mediaGallery_mobileGallery: [],
              priceInfo_currency: '$',
              priceInfo_regularPrice: null,
              priceInfo_specialprice: null,
              productDetailPageLink: null,
              whereToBuyLink: 'https://development--hisenseglobalweb--hisense-global-web.aem.live/us/en/tv/miniled/tv-116-class-ux-rgb-miniled-4k-google-tv',
              faqLink: null,
              reviewScript: {
                html: null,
              },
              tags: [
                'hisense:product/tv/screen-size/98-max',
                'hisense:product/tv/operating-system/google-tv',
                'hisense:product/tv/refresh-rate/165hz',
                'hisense:product/tv/resolution/uhd',
                'hisense:product/tv/type/rgb-miniled',
              ],
              productVideos: null,
              _variation: 'master',
            },
          ],
        },
      },
    };
  }

  const items = json && json.data && json.data.productModelList && json.data.productModelList.items;
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
        // 移除其他尺寸的选中状态
        sizesWrapper.querySelectorAll('.pdp-size').forEach((sizeEl) => {
          sizeEl.classList.remove('selected');
        });
        // 添加当前尺寸的选中状态
        el.classList.add('selected');
        // 更新标题
        title.textContent = p.title;
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
  specsImg.src = 'https://publish-p174152-e1855821.adobeaemcloud.com/content/dam/hisense/image/icon/specs.svg';
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