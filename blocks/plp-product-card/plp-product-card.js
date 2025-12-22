export default function decorate(block) {
  const isEditMode = block && block.hasAttribute && block.hasAttribute('data-aue-resource');

  const rows = [...(block.children || [])];
  let graphqlUrl = null;
  let graphqlResource = null;
  let fields = [];
  let fieldsResource = null;

  rows.forEach((row) => {
    const resource = row.getAttribute && row.getAttribute('data-aue-resource');
    const anchor = row.querySelector && row.querySelector('a');
    if (anchor) {
      graphqlUrl = anchor.getAttribute('href') || anchor.textContent.trim();
      graphqlResource = resource || anchor.getAttribute('data-aue-resource') || null;
    }
    const text = row.textContent && row.textContent.trim();
    if (text && text.indexOf(',') >= 0) {
      fields = text.split(',').map((s) => s.trim()).filter(Boolean);
      fieldsResource = resource;
    }
  });

  rows.forEach((row) => {
    if (row && row.parentNode) row.parentNode.removeChild(row);
  });

  const productsBox = document.createElement('div');
  productsBox.className = 'plp-products-box';
  const productsGrid = document.createElement('div');
  productsGrid.className = 'plp-products';
  productsBox.append(productsGrid);

  if (isEditMode) {
    const topWrapper = document.createElement('div');

    const btnRow = document.createElement('div');
    const p = document.createElement('p');
    p.className = 'button-container';
    const a = document.createElement('a');
    a.className = 'button';
    a.title = graphqlUrl || '';
    a.href = graphqlUrl || '#';
    a.textContent = graphqlUrl || '';
    if (graphqlResource) {
      a.setAttribute('data-aue-resource', graphqlResource);
    }

    p.appendChild(a);
    btnRow.appendChild(p);
    topWrapper.appendChild(btnRow);

    const fieldsRow = document.createElement('div');
    const fieldsInner = document.createElement('div');
    const pf = document.createElement('p');
    pf.textContent = fields.join(',');
    fieldsInner.appendChild(pf);
    if (fieldsResource) fieldsInner.setAttribute('data-aue-resource', fieldsResource);
    fieldsRow.appendChild(fieldsInner);
    topWrapper.appendChild(fieldsRow);

    block.replaceChildren(topWrapper, productsBox);
  } else {
    block.replaceChildren(productsBox);
  }

  if (!graphqlUrl) return;

  function renderItems(items) {
    productsGrid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'plp-product-card-title';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'plp-product-img';
      // allow access to API fields that start with underscore
      // eslint-disable-next-line no-underscore-dangle
      const imgPath = (item && item.mediaGallery_image && item.mediaGallery_image._path) || null;
      if (imgPath) {
        imgDiv.style.backgroundImage = `url(${imgPath})`;
        imgDiv.style.backgroundSize = 'cover';
        imgDiv.style.backgroundPosition = 'center';
      }

      const seriesDiv = document.createElement('div');
      seriesDiv.className = 'plp-product-series';
      if (fields.includes('series') && item.series) seriesDiv.textContent = item.series;

      const nameDiv = document.createElement('div');
      nameDiv.className = 'plp-product-name';
      if (fields.includes('title')) {
        // eslint-disable-next-line no-underscore-dangle
        const metaTitle = item && item._metadata && item._metadata.stringMetadata && item._metadata.stringMetadata.find((m) => m.name === 'title')?.value;
        nameDiv.textContent = item.title || metaTitle || '';
      }

      const extraFields = document.createElement('div');
      extraFields.className = 'plp-product-extra';
      fields.forEach((f) => {
        if (['title', 'series', 'mediaGallery_image'].includes(f)) return;
        const keyParts = f.includes('.') ? f.split('.') : f.split('_');
        const value = keyParts.reduce(
          (acc, k) => (acc && acc[k] !== undefined ? acc[k] : null),
          item,
        );
        if (value !== null && value !== undefined) {
          const fld = document.createElement('div');
          const safeClass = `plp-product-field-${f.replace(/[^a-z0-9_-]/gi, '')}`;
          fld.className = `plp-product-field ${safeClass}`;
          fld.textContent = value;
          extraFields.appendChild(fld);
        }
      });

      if (item && item.whereToBuyLink) {
        const link = document.createElement('a');
        link.className = 'plp-product-btn';
        link.href = item.whereToBuyLink;
        link.target = '_blank';
        link.textContent = 'Learn more';
        card.append(titleDiv, imgDiv, seriesDiv, nameDiv, extraFields, link);
      } else {
        card.append(titleDiv, imgDiv, seriesDiv, nameDiv, extraFields);
      }
      productsGrid.append(card);
    });
  }

  const mockData = {
    data: {
      productModelList: {
        items: [
          {
            _path: '/content/dam/hisense/content-fragments/product-model/us/-TELEVISIONS/4k-uled/75-u-65-qf-43',
            _metadata: { stringMetadata: [{ name: 'title', value: '75U65QF-43' }] },
            title: 'Hisense 75" Class U6 Series MiniLED ULED 4K Fire TV',
            series: '4K ULED',
            mediaGallery_image: { _path: '/content/dam/hisense/image/product/75u65qf/991681.jpg' },
            whereToBuyLink: 'http://amazon.com/dp/B0DN6THH67',
          },
          {
            _path: '/content/dam/hisense/content-fragments/product-model/us/-TELEVISIONS/4k-uled/75-u-65-qf-50',
            _metadata: { stringMetadata: [{ name: 'title', value: '75U65QF-50' }] },
            title: 'Hisense 75" Class U6 Series MiniLED ULED 4K Fire TV',
            series: '4K ULED',
            mediaGallery_image: { _path: '/content/dam/hisense/image/product/75u65qf/991681.jpg' },
          },
        ],
      },
    },
  };

  fetch(graphqlUrl)
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      const items = (data
        && data.data
        && data.data.productModelList
        && data.data.productModelList.items) || [];
      renderItems(items);
    })
    .catch(() => {
      const items = (mockData
        && mockData.data
        && mockData.data.productModelList
        && mockData.data.productModelList.items) || [];
      renderItems(items);
    });
}
