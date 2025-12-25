function applyAggregatedSort(sortProperty, direction = -1) {
  try {
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

    // 按 factoryModel 分组，计算每个组在指定属性上的最大值
    const groupedByFactoryModel = {};
    const factoryModelMaxValues = {};

    listToSort.forEach((item) => {
      const { factoryModel } = item;
      if (!groupedByFactoryModel[factoryModel]) {
        groupedByFactoryModel[factoryModel] = [];
      }
      groupedByFactoryModel[factoryModel].push(item);

      // 计算该 factoryModel 在指定属性上的最大值
      const value = normalizeValueForSort(getPropertyByKey(item, sortProperty));
      if (value !== null && value !== undefined) {
        if (!factoryModelMaxValues[factoryModel]
            || (typeof value === 'number' && typeof factoryModelMaxValues[factoryModel] === 'number' && value > factoryModelMaxValues[factoryModel])
            || (typeof value === 'string' && typeof factoryModelMaxValues[factoryModel] === 'string' && String(value).localeCompare(String(factoryModelMaxValues[factoryModel])) > 0)) {
          factoryModelMaxValues[factoryModel] = value;
        }
      }
    });

    // 按最大值进行排序
    const sortedProducts = listToSort.slice().sort((a, b) => {
      const maxValueA = factoryModelMaxValues[a.factoryModel];
      const maxValueB = factoryModelMaxValues[b.factoryModel];

      // 处理空值情况
      if (maxValueA === null || maxValueA === undefined) return 1 * direction;
      if (maxValueB === null || maxValueB === undefined) return -1 * direction;
      if (maxValueA === maxValueB) return 0;

      if (typeof maxValueA === 'number' && typeof maxValueB === 'number') {
        return (maxValueA - maxValueB) * direction;
      }
      return String(maxValueA).localeCompare(String(maxValueB)) * direction;
    });

    // 如果是按尺寸排序，设置标志表示产品卡片应默认选中最大尺寸
    if (!sortProperty || sortProperty === 'size') {
      window.isDefaultSortApplied = true;
    } else {
      window.isDefaultSortApplied = false;
    }

    window.renderPlpProducts(sortedProducts);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn('Aggregated sort error:', e);
  }
}

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

  function extractImageFromShortDescription(item) {
    if (!item || !item.description_shortDescription || !item.description_shortDescription.html) {
      return null;
    }

    const { html } = item.description_shortDescription;
    // 从 <p> 标签中提取文本内容
    const match = html.match(/<p>([^<]+)<\/p>/);
    return match ? match[1].trim() : null;
  }

  function applyDefaultSort() {
    // 使用聚合排序认按尺寸排序（降序）
    applyAggregatedSort('size', -1);
  }

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
      // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
      if (window.useShortDescriptionAsImage) {
        if (!groups[key].representative.description_shortDescription
            && it.description_shortDescription) {
          groups[key].representative = it;
        }
      } else if (!groups[key].representative.mediaGallery_image && it.mediaGallery_image) {
        // 否则走默认逻辑
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
        // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
        if (window.useShortDescriptionAsImage) {
          return extractImageFromShortDescription(item);
        }
        // 否则走默认逻辑
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
      // 如果用了默认排序，默认选中最大尺寸，其他排序选中第一个尺寸
      let selectedSize;
      if (sizesArray.length) {
        selectedSize = window.isDefaultSortApplied
          ? sizesArray[sizesArray.length - 1]
          : sizesArray[0];
      } else {
        selectedSize = null;
      }
      let selectedVariant = selectedSize ? (sizeToVariant.get(selectedSize) || item) : item;

      // 用来更新卡片显示为指定变体
      const updateCardWithVariant = (variant) => {
        // image
        const variantImg = (() => {
          // 如果开关打开了，优先使用 description_shortDescription 属性作为图片链接
          if (window.useShortDescriptionAsImage) {
            return extractImageFromShortDescription(variant);
          }
          // 否则走默认逻辑
          const imgPKey = variant && variant.mediaGallery_image && Object.keys(variant.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
          return imgPKey ? variant.mediaGallery_image[imgPKey] : null;
        })();

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
      // 页面初始化查询用默认排序
      applyDefaultSort();
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
      // 页面初始化查询用默认排序
      applyDefaultSort();
    });
  /* eslint-disable-next-line no-underscore-dangle */
  window.renderItems = renderItems;
}

// 是否使用 description_shortDescription 作为图片链接，默认使用
window.useShortDescriptionAsImage = true;

// 暴露渲染和筛选接口到window全局，供 filter 和 tags 使用（在 renderItems 定义后）
window.renderProductsInternal = function renderProductsInternalProxy(items) {
  if (typeof window.renderItems === 'function') {
    window.renderItems(items);
  }
};
window.lastRenderedProducts = null;
// 当前排序状态，用于筛选时判断是否需要默认选中最大尺寸
window.currentSortKey = '';

window.renderPlpProducts = function renderPlpProductsWrapper(items) {
  window.lastRenderedProducts = Array.isArray(items) ? items.slice() : [];
  window.renderProductsInternal(items);
};

// 排序
// eslint-disable-next-line consistent-return
window.applyPlpSort = function applyPlpSort(sortKey) {
  try {
    const sortProperty = String(sortKey || '').trim();

    // 保存当前排序状态
    window.currentSortKey = sortProperty;

    let direction = -1; // 默认降序
    let effectiveSortProperty = sortProperty;
    if (effectiveSortProperty.startsWith('-')) {
      direction = 1; // 升序
      effectiveSortProperty = effectiveSortProperty.slice(1);
    }

    // 如果没有指定排序属性或者指size
    if (!effectiveSortProperty || effectiveSortProperty === 'size') {
      return applyAggregatedSort('size', direction);
    }

    // 其他属性也使用聚合后排序逻辑
    applyAggregatedSort(effectiveSortProperty, direction);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn(e);
  }
};

// filters：获取选中的 data-option-value checkbox，并对 window.productData 进行过滤
window.applyPlpFilters = function applyPlpFilters() {
  try {
    // 检查当前排序状态，如果是默认排序和size，需要筛选后后默认选中最大尺寸
    const currentSort = String(window.currentSortKey || '').trim();
    const effectiveSort = currentSort.startsWith('-') ? currentSort.slice(1) : currentSort;
    window.isDefaultSortApplied = (!effectiveSort || effectiveSort === 'size');

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
