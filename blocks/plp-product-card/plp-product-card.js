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
  const productsLoadMore = document.createElement('div');
  productsLoadMore.className = 'plp-load-more';
  const mockUrl = 'https://www.hisense-usa.com/category/televisions';
  productsLoadMore.addEventListener('click', () => {
    if (mockUrl) window.location.href = mockUrl;
  });
  const span = document.createElement('span');
  span.textContent = 'Load more';

  productsLoadMore.append(span);
  productsBox.append(productsGrid);
  productsBox.append(productsLoadMore);

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
    // 包含多个相同 factoryModel 的不同尺寸
    productsGrid.innerHTML = '';

    const extractSize = (item) => {
      if (!item) return null;
      if (item.size) return String(item.size).replace(/["\s]/g, '');
      if (item.sku) {
        const m = String(item.sku).match(/(\d{2,3})/);
        if (m) return m[1];
      }
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
      const candidates = [metaTitle, item.title, item.subtitle].filter(Boolean);
      let foundSize = null;
      candidates.some((c) => {
        const mm = String(c).match(/(\d{2,3})/);
        if (mm) {
          const [, size] = mm;
          foundSize = size;
          return true;
        }
        return false;
      });
      if (foundSize) return foundSize;
      return null;
    };

    // 按 factoryModel 聚合
    const groups = {};
    items.forEach((it) => {
      const key = it.factoryModel || it.spu || it.overseasModel;
      if (!groups[key]) {
        groups[key] = {
          factoryModel: it.factoryModel || null,
          representative: it,
          variants: [],
          sizes: new Set(),
        };
      }
      groups[key].variants.push(it);
      if (!groups[key].representative.mediaGallery_image && it.mediaGallery_image) {
        groups[key].representative = it;
      }
      const sz = extractSize(it);
      if (sz) groups[key].sizes.add(sz);
    });

    const groupedArray = Object.keys(groups).map((k) => {
      const g = groups[k];
      const sizes = Array.from(g.sizes).filter(Boolean).sort((a, b) => Number(a) - Number(b));
      return {
        key: k,
        factoryModel: g.factoryModel,
        representative: g.representative,
        variants: g.variants,
        sizes,
      };
    });

    // 渲染每个聚合后的产品卡片
    groupedArray.forEach((group) => {
      const item = group.representative;
      const card = document.createElement('div');
      card.className = 'product-card';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'plp-product-card-title';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'plp-product-img';
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
      seriesDiv.className = 'plp-product-series';
      if (fields.includes('series') && item.series) seriesDiv.textContent = item.series;

      const nameDiv = document.createElement('div');
      nameDiv.className = 'plp-product-name';
      if (fields.includes('title')) {
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
        nameDiv.textContent = item.title || metaTitle || group.factoryModel || '';
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

      // sizes 区块（可点击，默认选中第一个尺寸，切换显示对应 variant）
      const sizesDiv = document.createElement('div');
      sizesDiv.className = 'plp-product-sizes';

      // 构建 size -> variant 的映射
      const sizeToVariant = new Map();
      group.variants.forEach((v) => {
        let s = extractSize(v);
        if (!s && v.sku) {
          const skuMatch = String(v.sku).match(/(\d{2,3})/);
          s = skuMatch ? skuMatch[1] : null;
        }
        if (!s) s = 'default';
        if (!sizeToVariant.has(s)) sizeToVariant.set(s, v);
      });

      const sizesArray = (Array.isArray(group.sizes) && group.sizes.length)
        ? group.sizes
        : Array.from(sizeToVariant.keys());
      let selectedSize = sizesArray.length ? sizesArray[0] : null;
      let selectedVariant = selectedSize ? (sizeToVariant.get(selectedSize) || item) : item;

      // 用来更新卡片显示为指定变体
      const updateCardWithVariant = (variant) => {
        // image
        const imgPKey = variant && variant.mediaGallery_image && Object.keys(variant.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
        const variantImg = imgPKey ? variant.mediaGallery_image[imgPKey] : null;
        const updateImg = imgDiv.querySelector('img');
        if (variantImg && updateImg) {
          updateImg.src = variantImg;
        } else if (updateImg) {
          updateImg.src = '';
        }
        // series
        if (fields.includes('series') && variant.series) seriesDiv.textContent = variant.series;
        // title/name
        const metaKey = variant && Object.keys(variant).find((k) => k.toLowerCase().includes('metadata'));
        let variantMetaTitle = null;
        if (metaKey) {
          const meta = variant[metaKey];
          if (meta && Array.isArray(meta.stringMetadata)) {
            const found = meta.stringMetadata.find((x) => x.name === 'title');
            variantMetaTitle = found ? found.value : null;
          }
        }
        if (fields.includes('title')) {
          nameDiv.textContent = variant.title || variantMetaTitle || group.factoryModel || '';
        }
        // extra fields
        extraFields.innerHTML = '';
        fields.forEach((f) => {
          if (['title', 'series', 'mediaGallery_image'].includes(f)) return;
          const keyParts = f.includes('.') ? f.split('.') : f.split('_');
          const value = keyParts.reduce(
            (acc, k) => (acc && acc[k] !== undefined ? acc[k] : null),
            variant,
          );
          if (value !== null && value !== undefined) {
            const fld = document.createElement('div');
            const safeClass = `plp-product-field-${f.replace(/[^a-z0-9_-]/gi, '')}`;
            fld.className = `plp-product-field ${safeClass}`;
            fld.textContent = value;
            extraFields.appendChild(fld);
          }
        });
        // whereToBuyLink
        if (variant && variant.whereToBuyLink) {
          let link = card.querySelector && card.querySelector('.plp-product-btn');
          if (!link) {
            link = document.createElement('a');
            link.className = 'plp-product-btn';
            link.target = '_blank';
            card.append(link);
          }
          link.href = variant.whereToBuyLink;
          link.textContent = 'Learn more';
        } else {
          const existingLink = card.querySelector && card.querySelector('.plp-product-btn');
          if (existingLink) existingLink.remove();
        }
      };

      // 创建尺寸节点并绑定事件
      sizesArray.forEach((s) => {
        const sp = document.createElement('span');
        sp.className = 'plp-product-size';
        sp.textContent = s;
        if (s === selectedSize) sp.classList.add('selected');
        sp.addEventListener('click', () => {
          if (selectedSize === s) return;
          // 更新选中样式
          const prev = sizesDiv.querySelector('.plp-product-size.selected');
          if (prev) prev.classList.remove('selected');
          sp.classList.add('selected');
          selectedSize = s;
          selectedVariant = sizeToVariant.get(s) || item;
          updateCardWithVariant(selectedVariant);
        });
        sizesDiv.appendChild(sp);
      });

      card.append(titleDiv, imgDiv, seriesDiv, nameDiv, sizesDiv, extraFields);
      productsGrid.append(card);

      updateCardWithVariant(selectedVariant);
    });

    // 更新结果计数，显示聚合后的产品卡数量
    try {
      const resultsEl = document.querySelector('.plp-results');
      if (resultsEl) {
        const visible = resultsEl.querySelector('.plp-results-count-visible');
        const hidden = resultsEl.querySelector('.plp-results-count');
        const count = groupedArray.length;
        if (visible) {
          visible.textContent = String(count);
        }
        if (hidden) {
          hidden.textContent = String(count);
        }
        if (!visible && !hidden) {
          const currentText = resultsEl.textContent || '';
          const updatedText = currentText.replace(/\{[^}]*\}/, String(count));
          resultsEl.textContent = updatedText;
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }
  }

  const mockData = {
    data: {
      productModelList: {
        items: [
          {
            _path: '/content/dam/43A7N',
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
              html: '<p>Hisense 43&#34; Class A7 Series LCD 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
          },
          {
            _path: '/content/dam/50A7N',
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
              html: '<p>Hisense 50&#34; Class A7 Series LCD 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
          },
          {
            _path: '/content/dam/65A7N',
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
              html: '<p>Hisense 65&#34; Class A7 Series LCD 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
          },
          {
            _path: '/content/dam/75A7N',
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
              html: '<p>Hisense 75&#34; Class A7 Series LCD 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
          },
          {
            _path: '/content/dam/85A7N',
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
              html: '<p>Hisense 85&#34; Class A7 Series LCD 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
          },
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
              html: '<p>Hisense 100&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 100&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 100&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 116&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 55&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
          },
          {
            _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/116U75QG-65',
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
            subtitle: 'Hisense 65 Class U7 Series MiniLED ULED 4K Google TV',
            series: 'U7 Series',
            platform: null,
            size: '65',
            description_description: {
              html: '<p>Hisense 65&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
            },
            description_shortDescription: {
              html: '<p>Hisense 65&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
              'hisense:product/tv/screen-size/65',
            ],
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 75&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 43&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 43&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 50&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 50&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 55&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
          },
          {
            _path: '/content/dam/hisense/content-fragments/product-model/us/televisions/55A7N',
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
              html: '<p>Hisense 55&#34; Class A7 Series LCD 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 55&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 55&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 65&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
            },
            description_shortDescription: {
              html: '<p>Hisense 65&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 65&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 65&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 55&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 65&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 75&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 75&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 75&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 75&#34; Class U9 Series Mini-LED QLED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
            },
            enabled: true,
            launchingCountries: [
              '',
            ],
            productLaunchDate: '2025-03-31T16:00:00.000Z',
            productEndOfLifeDate: null,
            mediaGallery_image: null,
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
            title: 'Hisense 85" Class U8 Series MiniLED ULED 4K Google TV',
            subtitle: 'Hisense 85" Class U8 Series MiniLED ULED 4K Google TV',
            series: 'U8 Series',
            platform: null,
            size: '65',
            description_description: {
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
            },
            description_shortDescription: {
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
            },
            description_shortDescription: {
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
            size: null,
            description_description: {
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
            },
            description_shortDescription: {
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 85&#34; Class U9 Series Mini-LED QLED 4K Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 50&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
            tags: null,
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
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
              html: '<p>Hisense 116” Class UX Series RGB MiniLEDULED 4K Google TV</p>',
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
            whereToBuyLink: 'https://development--hisenseglobalweb--hisense-global-web.aem.live/ui-testing/116ux',
            faqLink: null,
            reviewScript: {
              html: null,
            },
            tags: [
              'hisense:product/tv/screen-size/98-max',
            ],
            productVideos: null,
            sellingPoint1Title: null,
            sellingPoint1Subtitle: null,
            sellingPoint1Description: {
              html: null,
            },
            sellingPoint1VideoImage: null,
            sellingPoint2Title: null,
            sellingPoint2Subtitle: null,
            sellingPoint2Description: {
              html: null,
            },
            sellingPoint2VideoImage: null,
            sellingPoint3Title: null,
            sellingPoint3Subtitle: null,
            sellingPoint3Description: {
              html: null,
            },
            sellingPoint3VideoImage: null,
            sellingPoint4Title: null,
            sellingPoint4Subtitle: null,
            sellingPoint4Description: {
              html: null,
            },
            sellingPoint4VideoImage: null,
            sellingPoint5Title: null,
            sellingPoint5Subtitle: null,
            sellingPoint5Description: {
              html: null,
            },
            sellingPoint5VideoImage: null,
            sellingPoint6Title: null,
            sellingPoint6Subtitle: null,
            sellingPoint6Description: {
              html: null,
            },
            sellingPoint6VideoImage: null,
            sellingPoint7Title: null,
            sellingPoint7Subtitle: null,
            sellingPoint7Description: {
              html: null,
            },
            sellingPoint7VideoImage: null,
            sellingPoint8Title: null,
            sellingPoint8Subtitle: null,
            sellingPoint8Description: {
              html: null,
            },
            sellingPoint8VideoImage: null,
            sellingPoint9Title: null,
            sellingPoint9Subtitle: null,
            sellingPoint9Description: {
              html: null,
            },
            sellingPoint9VideoImage: null,
            specificationsPictureResolutionLabel: 'Specifications-Picture-Resolution',
            specificationsPictureEngineLabel: 'Specifications-Picture-Engine',
            specificationsPictureBrightnessLabel: 'Specifications-Picture-Brightness',
            specificationsPictureBacklightLabel: 'Specifications-Picture-Backlight ',
            specificationsPictureColourLabel: 'Specifications-Picture-Colour',
            specificationsPictureDisplayLabel: 'Specifications -Picture-Display',
            specificationsPictureHdrLabel: 'Specifications-Picture-HDR',
            specificationsPictureAiFeaturesLabel: 'Specifications-Picture-AI Features',
            specificationsPictureMotionLabel: 'Specifications-Picture-Motion',
            specificationsPictureGamingLabel: 'Specifications-Picture-Gaming',
            specificationsAudioLabel: 'Specifications-Audio',
            specificationsSmartLabel: 'Specifications-Smart',
            specificationsConnectivityLabel: 'Specifications-Connectivity',
            specificationsDesignLabel1: null,
            specificationsEsgLabel: 'Specifications-ESG',
            specificationsProductDimensionsLabel: 'Specifications-Product Dimensions',
            specificationsPowerLabel: 'Specifications-Power',
            specificationsPortsLabel: 'Specifications-Ports',
            specificationsOtherFeaturesLabel: 'Specifications-Other Features',
            specificationsAccessoriesLabel: 'Specifications-Accessories',
            specificationsWallMountLabel: 'Specifications-Wall Mount',
            specificationsGamingLabel: 'Specifications-Gaming',
            specificationsWarrantyUpcLabel: 'Specifications-WARRANTY / UPC',
            specificationsDownloadLabel: 'Specifications-Download',
            specificationsPictureResolution: [
              '',
            ],
            specificationsPictureEngine: [
              '',
            ],
            specificationsPictureBrightness: [
              '',
            ],
            specificationsPictureBacklight: [
              '',
            ],
            specificationsPictureColour: [
              '',
            ],
            specificationsPictureDisplay: [
              '',
            ],
            specificationsPictureHdr: [
              '',
            ],
            specificationsPictureAiFeatures: [
              '',
            ],
            specificationsPictureMotion: [
              '',
            ],
            specificationsPictureGaming: [
              '',
            ],
            specificationsAudio: [
              '',
            ],
            specificationsSmart: null,
            specificationsConnectivity: [
              '',
            ],
            specificationsDesign: [
              '',
            ],
            specificationsEsg: [
              '',
            ],
            specificationsProductDimensions: [
              '',
            ],
            specificationsPower: [
              '',
            ],
            specificationsPorts: null,
            specificationsOtherFeatures: [
              '',
            ],
            specificationsAccessories: [
              '',
            ],
            specificationsWallMount: [
              '',
            ],
            specificationsGaming: [
              '',
            ],
            specificationsWarrantyUpc: [
              '',
            ],
            specificationsDownload: [
              '',
            ],
            _variation: 'master',
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
      // 缓存到全局，供过滤器使用
      window.productData = items;
      if (window.renderPlpProducts) {
        window.renderPlpProducts(items);
      } else {
        renderItems(items);
      }
    })
    .catch(() => {
      const items = (mockData
        && mockData.data
        && mockData.data.productModelList
        && mockData.data.productModelList.items) || [];
      window.productData = items;
      if (window.renderPlpProducts) {
        window.renderPlpProducts(items);
      } else {
        renderItems(items);
      }
    });
  /* eslint-disable-next-line no-underscore-dangle */
  window.renderItems = renderItems;
}

// 暴露渲染和筛选接口到window全局，供 filter 和 tags 使用（在 renderItems 定义后）
window.renderProductsInternal = function renderProductsInternalProxy(items) {
  if (typeof window.renderItems === 'function') {
    window.renderItems(items);
  }
};
window.lastRenderedProducts = null;
window.renderPlpProducts = function renderPlpProductsWrapper(items) {
  window.lastRenderedProducts = Array.isArray(items) ? items.slice() : [];
  window.renderProductsInternal(items);
};

// 排序
window.applyPlpSort = function applyPlpSort(sortKey) {
  try {
    if (!sortKey) return;
    const sortProperty = String(sortKey).trim();
    const lastRendered = Array.isArray(window.lastRenderedProducts);
    const hasLast = lastRendered && window.lastRenderedProducts.length;
    let listToSort;
    if (hasLast) {
      listToSort = window.lastRenderedProducts.slice();
    } else if (Array.isArray(window.productData)) {
      listToSort = window.productData.slice();
    } else {
      listToSort = [];
    }
    if (!listToSort || !listToSort.length) {
      return;
    }

    // 通过 key 获取 product model 的属性
    const getPropertyByKey = (item, propKey) => {
      if (!item || !propKey) return undefined;
      if (Object.prototype.hasOwnProperty.call(item, propKey)) return item[propKey];
      const parts = propKey.includes('.') ? propKey.split('.') : propKey.split('_');
      return parts.reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), item);
    };

    // 序列化属性，排序属性的值类型中包含尺寸，时间，价格，文本
    const normalizeValueForSort = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T/.test(value)) {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? String(value).toLowerCase() : parsed;
      }
      if (typeof value === 'string' && sortProperty.toLowerCase().includes('size')) {
        const m = value.match(/(\d+(\.\d+)?)/);
        if (m) return parseFloat(m[1]);
      }
      return String(value).toLowerCase();
    };

    // 排序，默认desc，如果属性前缀加上"-"则默认asc
    let direction = 1;
    let effectiveSortProperty = sortProperty;
    if (effectiveSortProperty.startsWith('-')) {
      direction = -1;
      effectiveSortProperty = effectiveSortProperty.slice(1);
    }

    const sortedList = listToSort.slice().sort((a, b) => {
      const valA = normalizeValueForSort(getPropertyByKey(a, effectiveSortProperty));
      const valB = normalizeValueForSort(getPropertyByKey(b, effectiveSortProperty));
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1 * direction;
      if (valB === null || valB === undefined) return -1 * direction;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * direction;
      }
      return String(valA).localeCompare(String(valB)) * direction;
    });

    window.renderPlpProducts(sortedList);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn(e);
  }
};

// filters：获取选中的 data-option-value checkbox，并对 window.productData 进行过滤
window.applyPlpFilters = function applyPlpFilters() {
  try {
    const allProducts = window.productData || [];

    // 收集所有被选中的 filter group,同组内为 OR，不同组为 AND
    const filterGroups = [...document.querySelectorAll('.plp-filter-group')];
    const selectedByGroup = filterGroups.map((group) => [...group.querySelectorAll('input[type="checkbox"][data-option-value]:checked')]
      .map((checkbox) => checkbox.getAttribute('data-option-value'))
      .filter(Boolean)).filter((arr) => arr && arr.length);

    if (!selectedByGroup.length) {
      // 无过滤时恢复全部
      window.renderPlpProducts(allProducts);
      return;
    }

    // 执行过滤，要求产品必须要有tags属性
    const filtered = allProducts.filter((item) => {
      const tagsRaw = Array.isArray(item.tags) ? item.tags : [];
      const itemTags = tagsRaw.map((t) => String(t).toLowerCase());
      if (!itemTags.length) return false;

      return selectedByGroup.every((groupSelected) => groupSelected.some((selectedTag) => {
        const selectedLower = String(selectedTag).toLowerCase();
        // 完全匹配标签路径
        return itemTags.includes(selectedLower);
      }));
    });

    window.renderPlpProducts(filtered);
  } catch (err) {
    /* eslint-disable-next-line no-console */
    if (window.renderPlpProducts) window.renderPlpProducts(window.productData || []);
  }
};
