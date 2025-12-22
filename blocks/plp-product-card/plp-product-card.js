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
    if (graphqlResource){
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
      card.className = 'plp-product-card';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'plp-product-card-title';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'plp-product-img';
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
        nameDiv.textContent = item.title || (item._metadata && item._metadata.stringMetadata && item._metadata.stringMetadata.find((m) => m.name === 'title')?.value) || '';
      }

      const extraFields = document.createElement('div');
      extraFields.className = 'plp-product-extra';
      fields.forEach((f) => {
        if (['title', 'series', 'mediaGallery_image'].includes(f)) return;
        const keyParts = f.includes('.') ? f.split('.') : f.split('_');
        const value = keyParts.reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), item);
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
    "data": {
      "productModelList": {
        "items": [
          {
            "_path": "/content/dam/hisense/content-fragments/product-model/us/-TELEVISIONS/4k-uled/75-u-65-qf-43",
            "_metadata": {
              "stringMetadata": [
                {
                  "name": "title",
                  "value": "75U65QF-43"
                },
                {
                  "name": "description",
                  "value": ""
                }
              ]
            },
            "sku": "75U65QF-50",
            "overseasModel": "U8",
            "factoryModel": "U85QEVS, U85QAVS(85,100)",
            "badge": "New",
            "awards": [
              {
                "_path": "/content/dam/hisense/image/product/awards/CES_Picks_Awards_2025.png"
              },
              {
                "_path": "/content/dam/hisense/image/product/awards/IFA_2025Honoree.png"
              },
              {
                "_path": "/content/dam/hisense/image/product/awards/2025_Badge_CES.png"
              },
              {
                "_path": "/content/dam/hisense/image/product/awards/PC_MAG.png"
              }
            ],
            "title": "Hisense 75\" Class U6 Series MiniLED ULED 4K Fire TV ",
            "subtitle": "Hisense 75\" Class U6 Series MiniLED ULED 4K Fire TV ",
            "size": "43\"",
            "series": "4K ULED",
            "seriesIcon": null,
            "description_description": {
              "html": "<p>Hisense 75\" Class U6 Series MiniLED ULED 4K Fire TV</p>"
            },
            "description_shortDescription": {
              "html": "<p>Hisense 75\" Class U6 Series MiniLED ULED 4K Fire TV</p>"
            },
            "enabled": true,
            "productLaunchDate": "2025-12-17T16:00:00.000Z",
            "productEndOfLifeDate": "2025-12-30T16:00:00.000Z",
            "mediaGallery_image": {
              "_path": "/content/dam/hisense/image/product/75u65qf/991681_42f35812c3e443119382c95cd7c55fb9~mv2.jpg"
            },
            "mediaGallery_gallery": [
              {
                "_path": "/content/dam/hisense/image/product/75u65qf/1d7134_f14ac53a8722435883863f097da3f517~mv2.webp"
              },
              {
                "_path": "/content/dam/hisense/image/product/75u65qf/1d7134_a313ffc3cf5144448aaecdf2d695cff3~mv2.webp"
              }
            ],
            "mediaGallery_mobileImage": null,
            "mediaGallery_mobileGallery": [],
            "priceInfo_currency": "$",
            "priceInfo_regularPrice": 20000,
            "priceInfo_specialprice": 18000,
            "priceInfo_bottomPrice": 10000,
            "productDetailPageLink": null,
            "whereToBuyLink": "http://amazon.com/dp/B0DN6THH67?tag=psuni-01-US-6998-20&ascsubtag=wtbs_6945105b9a324f64010cda03&me=ATVPDKIKX0DER",
            "faqLink": null,
            "color_colorName": null,
            "color_colorValue": null,
            "color_pcColorGallery": [],
            "color_mobileColorGallery": [],
            "reviewScript": {
              "html": null
            },
            "tags": null,
            "specificationsPictureResolution": [
              "4K",
              "FHD Resolution",
              "HD Resolution"
            ],
            "specificationsPictureEngine": [
              "Hi-View AI Engine X ",
              "Hi-View AI Engine PRO"
            ],
            "specificationsPictureBrightness": [
              "Peak Brightness",
              "Typical brightness"
            ],
            "specificationsPictureBacklight": [
              "Mini-LED X ",
              "Mini-LED",
              "Direct Full Array"
            ],
            "specificationsPictureColour": [
              "OLED",
              "OLED Colour",
              "3D Colour Master PRO",
              "Natural Colour Enhancer "
            ],
            "specificationsPictureDisplay": [
              "Ultra Viewing Angle",
              "Anti-Reflection ",
              "High Contrast "
            ],
            "specificationsPictureHdr": [
              "Dolby Vision IQ",
              "HDR10+ Adaptive",
              "HDR Upscaler "
            ],
            "specificationsPictureAiFeatures": [
              "AI 4K Upscaler",
              "AI Light Sensor ",
              "AI Depth PRO",
              "AI Depth "
            ],
            "specificationsPictureMotion": [
              "AI Smooth Motion"
            ],
            "specificationsPictureGaming": [
              "165Hz Game Mode Ultra",
              "Game Mode PLUS",
              "240 High Refresh Rate",
              "120 High Refresh Rate",
              "Gaming in Dolby",
              "AMD Freesync Certifications"
            ],
            "specificationsAudio": null,
            "specificationsSmart": null,
            "specificationsConnectivity": null,
            "specificationsDesign": null,
            "specificationsEsg": null,
            "_variation": "master"
          },
          {
            "_path": "/content/dam/hisense/content-fragments/product-model/us/-TELEVISIONS/4k-uled/75-u-65-qf-50",
            "_metadata": {
              "stringMetadata": [
                {
                  "name": "title",
                  "value": "75U65QF-50"
                },
                {
                  "name": "description",
                  "value": ""
                }
              ]
            },
            "sku": "75U65QF-50",
            "overseasModel": "U8",
            "factoryModel": "U85QEVS, U85QAVS(85,100)",
            "badge": "New",
            "awards": [
              {
                "_path": "/content/dam/hisense/image/product/awards/CES_Picks_Awards_2025.png"
              }
            ],
            "title": "Hisense 75\" Class U6 Series MiniLED ULED 4K Fire TV ",
            "subtitle": "Hisense 75\" Class U6 Series MiniLED ULED 4K Fire TV ",
            "size": "43\"",
            "series": "4K ULED",
            "mediaGallery_image": {
              "_path": "/content/dam/hisense/image/product/75u65qf/991681_42f35812c3e443119382c95cd7c55fb9~mv2.jpg"
            },
            "priceInfo_currency": "$",
            "priceInfo_regularPrice": 20000,
            "priceInfo_specialprice": 18000,
            "_variation": "master"
          }
        ]
      }
    }
  };

  fetch(graphqlUrl)
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      const items = (data && data.data && data.data.productModelList && data.data.productModelList.items) || [];
      renderItems(items);
    })
    .catch(() => {
      const items = (mockData && mockData.data && mockData.data.productModelList && mockData.data.productModelList.items) || [];
      renderItems(items);
    });
}
