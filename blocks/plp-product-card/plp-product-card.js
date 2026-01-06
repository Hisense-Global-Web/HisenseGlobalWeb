function applyAggregatedSort(sortProperty, direction = -1) {
  try {
    // 每次排序都使用原始数据而不是上一次排序的结果
    let listToSort;
    if (Array.isArray(window.productData)) {
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
  let loadMoreTextContent = null;
  let loadMoreLink = null;

  let anchorCount = 0;

  rows.forEach((row) => {
    const resource = row.getAttribute && row.getAttribute('data-aue-resource');
    const anchor = row.querySelector && row.querySelector('a');
    const text = row.textContent && row.textContent.trim();

    if (anchor && anchorCount === 0) {
      graphqlUrl = anchor.getAttribute('href') || anchor.textContent.trim();
      graphqlResource = resource || anchor.getAttribute('data-aue-resource') || null;
      anchorCount = anchorCount + 1;
    }
    else if (text && text.indexOf(',') >= 0) {
      fields = text.split(',').map((s) => s.trim()).filter(Boolean);
      fieldsResource = resource;
    }
    else {
      if (isEditMode) {
        if (row.querySelector('p').getAttribute('data-aue-prop') === 'loadMoreTextContent') {
          loadMoreTextContent = text || row.textContent;
        } else if (anchor && anchorCount === 1) {
          loadMoreLink = anchor.getAttribute('href') || anchor.textContent.trim();
          anchorCount = anchorCount + 1;
        }
      }

      if (!isEditMode) {
        if (anchor && anchorCount === 1) {
          loadMoreLink = anchor.getAttribute('href') || anchor.textContent.trim();
          anchorCount = anchorCount + 1;
        } else if (text && !text.includes(',') && text !== graphqlUrl && !anchor) {
          loadMoreTextContent = text;
        }
      }
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
  const loadMoreUrl = loadMoreLink || '#';
  productsLoadMore.addEventListener('click', () => {
    if (loadMoreUrl && loadMoreUrl !== '#') window.location.href = loadMoreUrl;
  });
  const span = document.createElement('span');
  span.textContent = loadMoreTextContent || 'Load more';

  const productsNoResult = document.createElement('div');
  productsNoResult.className = 'plp-products-no-result';
  productsNoResult.textContent = 'no result';
  productsNoResult.style.display = 'none';

  productsLoadMore.append(span);
  productsBox.append(productsGrid);
  productsBox.append(productsLoadMore);
  productsBox.append(productsNoResult);

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

    const loadMoreLinkRow = document.createElement('div');
    const loadMoreLinkInner = document.createElement('div');
    const loadMoreLinkP = document.createElement('p');
    const loadMoreLinkA = document.createElement('a');
    loadMoreLinkA.href = loadMoreLink || '#';
    loadMoreLinkA.title = loadMoreLink || '';
    loadMoreLinkA.textContent = loadMoreLink || '';
    loadMoreLinkA.className = 'button';
    loadMoreLinkP.appendChild(loadMoreLinkA);
    loadMoreLinkInner.appendChild(loadMoreLinkP);
    loadMoreLinkRow.appendChild(loadMoreLinkInner);
    topWrapper.appendChild(loadMoreLinkRow);

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
    const selectedSortOption = document.querySelector('.plp-sort-option.selected');
    if (selectedSortOption) {
      const sortValue = selectedSortOption.dataset.value
                       || selectedSortOption.getAttribute('data-value')
                       || '';
      if (sortValue && sortValue.trim()) {
        if (window.applyPlpSort) {
          window.applyPlpSort(sortValue);
        } else {
          applyAggregatedSort('size', -1);
        }
      } else {
        applyAggregatedSort('size', -1);
      }
    } else {
      applyAggregatedSort('size', -1);
    }
  }

  function renderItems(items) {
    // 处理所有产品数据的 whereToBuyLink
    items.forEach((item) => {
      if (item.whereToBuyLink && typeof item.whereToBuyLink === 'string') {
        const { hostname, pathname } = window.location;
        if (hostname.includes('hisense.com') && pathname.startsWith('/us')) {
          item.whereToBuyLink = item.whereToBuyLink.replace('/us/en', '/us');
        }
      }
    });

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

      // 检查聚合产品是否有任意size有whereToBuyLink，有就共享这个链接
      let sharedWhereToBuyLink = g.variants.find((variant) => variant && variant.whereToBuyLink)?.whereToBuyLink;

      if (sharedWhereToBuyLink && sharedWhereToBuyLink.startsWith('/')) {
        const currentUri = window.location.href;
        const hasContentHisense = currentUri.includes('/content/hisense');
        const wtbHasContentHisense = sharedWhereToBuyLink.includes('/content/hisense');

        if (hasContentHisense && !wtbHasContentHisense) {
          sharedWhereToBuyLink = `/content/hisense${sharedWhereToBuyLink}`;
        } else if (!hasContentHisense && wtbHasContentHisense) {
          sharedWhereToBuyLink = sharedWhereToBuyLink.replace('/content/hisense', '');
        }
        sharedWhereToBuyLink = sharedWhereToBuyLink.replace('.html', '');
      }

      return {
        key: k,
        factoryModel: g.factoryModel,
        representative: g.representative,
        variants: g.variants,
        sizes,
        sharedWhereToBuyLink,
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
        const fullTitle = item.title || metaTitle || group.factoryModel || '';
        nameDiv.textContent = fullTitle;
        // 添加完整的title作为tooltip
        nameDiv.title = fullTitle;
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
        // whereToBuyLink - 先检查当前产品尺寸是否有whereToBuyLink链接，如果没有，才使用共享链接
        const whereToBuyLink = variant.whereToBuyLink || group.sharedWhereToBuyLink;
        if (whereToBuyLink) {
          let link = card.querySelector && card.querySelector('.plp-product-btn');
          if (!link) {
            link = document.createElement('a');
            link.className = 'plp-product-btn';
            link.target = '_blank';
            card.append(link);
          }
          link.href = whereToBuyLink;
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

    // 当结果超过9个时才显示load more
    try {
      const loadMoreEl = document.querySelector('.plp-load-more');
      if (loadMoreEl) {
        if (groupedArray.length >= 9) {
          loadMoreEl.style.display = 'block';
        } else {
          loadMoreEl.style.display = 'none';
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }

    // 当结果为0时显示no result
    try {
      const noResultEl = document.querySelector('.plp-products-no-result');
      const cardWrapperEl = document.querySelector('.plp-product-card-wrapper');
      if (noResultEl) {
        if (groupedArray.length === 0) {
          noResultEl.style.display = 'flex';
          productsGrid.style.display = 'none';
          cardWrapperEl.style.cssText = 'margin: auto !important;';
        } else {
          noResultEl.style.display = 'none';
          productsGrid.style.display = 'grid';
          cardWrapperEl.style.cssText = '';
        }
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.warn(e);
    }
  }

  const mockData = {
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
      'overseasModel',
      'factoryModel',
      'whereToBuyLink',
      'faqLink',
      'size',
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
          html: '<p>Hisense 43&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
        overseasModel: 'A6',
        factoryModel: 'A65H',
        whereToBuyLink: null,
        faqLink: null,
        size: '43',
      },
      {
        sku: '55A65H',
        spu: '55A65H',
        erpcode: null,
        title: 'Hisense 55" Class A6 Series LED 4K UHD Smart Google TV',
        subtitle: 'Hisense 55" Class A6 Series LED 4K UHD Smart Google TV',
        series: 'A6 Series',
        description_description: {
          html: '<p>Hisense 55&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
        overseasModel: 'A6',
        factoryModel: 'A65H',
        whereToBuyLink: null,
        faqLink: null,
        size: '55',
      },
      {
        sku: '65A65H',
        spu: '65A65H',
        erpcode: null,
        title: 'Hisense 65" Class A6 Series LED 4K UHD Smart Google TV',
        subtitle: 'Hisense 65" Class A6 Series LED 4K UHD Smart Google TV',
        series: 'A6 Series',
        description_description: {
          html: '<p>Hisense 65&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
        overseasModel: 'A6',
        factoryModel: 'A65H',
        whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-65-inch-a6-series-led-4k-uhd-smart-google-tv-2021-65a65h',
        faqLink: null,
        size: '65',
      },
      {
        sku: '50A65H',
        spu: '50A65H',
        erpcode: null,
        title: 'Hisense 50" Class A6 Series LED 4K UHD Smart Google TV',
        subtitle: 'Hisense 50" Class A6 Series LED 4K UHD Smart Google TV',
        series: 'A6 Series',
        description_description: {
          html: '<p>Hisense 50&#34; Class A6 Series LED 4K UHD Smart Google TV</p>',
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
        overseasModel: 'A6',
        factoryModel: 'A65H',
        whereToBuyLink: null,
        faqLink: null,
        size: '50',
      },
      {
        sku: '43A7N',
        spu: '43A7N',
        erpcode: null,
        title: 'Hisense 43" Class A7 Series LCD 4K Google TV',
        subtitle: 'Hisense 43" Class A7 Series LCD 4K Google TV',
        series: 'A7 Series',
        description_description: {
          html: '<p>Hisense 43&#34; Class A7 Series LCD 4K Google TV</p>',
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
        overseasModel: 'A7',
        factoryModel: 'A7N',
        whereToBuyLink: null,
        faqLink: null,
        size: '43',
      },
      {
        sku: '50A7N',
        spu: '50A7N',
        erpcode: null,
        title: 'Hisense 50" Class A7 Series LCD 4K Google TV',
        subtitle: 'Hisense 50" Class A7 Series LCD 4K Google TV',
        series: 'A7 Series',
        description_description: {
          html: '<p>Hisense 50&#34; Class A7 Series LCD 4K Google TV</p>',
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
        overseasModel: 'A7',
        factoryModel: 'A7N',
        whereToBuyLink: null,
        faqLink: null,
        size: '50',
      },
      {
        sku: '55A7N',
        spu: '55A7N',
        erpcode: null,
        title: 'Hisense 55" Class A7 Series LCD 4K Google TV',
        subtitle: 'Hisense 55" Class A7 Series LCD 4K Google TV',
        series: 'A7 Series',
        description_description: {
          html: '<p>Hisense 55&#34; Class A7 Series LCD 4K Google TV</p>',
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
        overseasModel: 'A7',
        factoryModel: 'A7N',
        whereToBuyLink: null,
        faqLink: null,
        size: '55',
      },
      {
        sku: '65A7N',
        spu: '65A7N',
        erpcode: null,
        title: 'Hisense 65" Class A7 Series LCD 4K Google TV',
        subtitle: 'Hisense 65" Class A7 Series LCD 4K Google TV',
        series: 'A7 Series',
        description_description: {
          html: '<p>Hisense 65&#34; Class A7 Series LCD 4K Google TV</p>',
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
        overseasModel: 'A7',
        factoryModel: 'A7N',
        whereToBuyLink: null,
        faqLink: null,
        size: '65',
      },
      {
        sku: '75A7N',
        spu: '75A7N',
        erpcode: null,
        title: 'Hisense 75" Class A7 Series LCD 4K Google TV',
        subtitle: 'Hisense 75" Class A7 Series LCD 4K Google TV',
        series: 'A7 Series',
        description_description: {
          html: '<p>Hisense 75&#34; Class A7 Series LCD 4K Google TV</p>',
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
        overseasModel: 'A7',
        factoryModel: 'A7N',
        whereToBuyLink: null,
        faqLink: null,
        size: '75',
      },
      {
        sku: '85A7N',
        spu: '85A7N',
        erpcode: null,
        title: 'Hisense 85" Class A7 Series LCD 4K Google TV',
        subtitle: 'Hisense 85" Class A7 Series LCD 4K Google TV',
        series: 'A7 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class A7 Series LCD 4K Google TV</p>',
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
        overseasModel: 'A7',
        factoryModel: 'A7N',
        whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-55-class-a7-series-4k-wide-color-gamut-google-tv-55a7n',
        faqLink: null,
        size: '85',
      },
      {
        sku: '100QD7QF',
        spu: '100QD7QF',
        erpcode: null,
        title: 'MiniLED ULED 4K Fire TV',
        subtitle: 'MiniLED ULED 4K Fire TV',
        series: 'QD7 Series',
        description_description: {
          html: '<p>Hisense 100&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
        overseasModel: 'QD7',
        factoryModel: 'QD7QF',
        whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-75-class-qd7-series-miniled-uled-4k-fire-tv-75qd7qf',
        faqLink: null,
        size: '100',
      },
      {
        sku: '50QD7QF',
        spu: '50QD7QF',
        erpcode: null,
        title: 'MiniLED ULED 4K Fire TV',
        subtitle: 'MiniLED ULED 4K Fire TV',
        series: 'QD7 Series',
        description_description: {
          html: '<p>Hisense 50&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
        overseasModel: 'QD7',
        factoryModel: 'QD7QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '50',
      },
      {
        sku: '55QD7QF',
        spu: '55QD7QF',
        erpcode: null,
        title: 'MiniLED ULED 4K Fire TV',
        subtitle: 'MiniLED ULED 4K Fire TV',
        series: 'QD7 Series',
        description_description: {
          html: '<p>Hisense 55&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
        overseasModel: 'QD7',
        factoryModel: 'QD7QF',
        whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-75-class-qd7-series-miniled-uled-4k-fire-tv-75qd7qf',
        faqLink: null,
        size: '55',
      },
      {
        sku: '65QD7QF',
        spu: '65QD7QF',
        erpcode: null,
        title: 'MiniLED ULED 4K Fire TV',
        subtitle: 'MiniLED ULED 4K Fire TV',
        series: 'QD7 Series',
        description_description: {
          html: '<p>Hisense 65&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
        overseasModel: 'QD7',
        factoryModel: 'QD7QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '65',
      },
      {
        sku: '75QD7QF',
        spu: '75QD7QF',
        erpcode: null,
        title: 'MiniLED ULED 4K Fire TV',
        subtitle: 'MiniLED ULED 4K Fire TV',
        series: 'QD7 Series',
        description_description: {
          html: '<p>Hisense 75&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
        overseasModel: 'QD7',
        factoryModel: 'QD7QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '75',
      },
      {
        sku: '85QD7QF',
        spu: '85QD7QF',
        erpcode: null,
        title: 'MiniLED ULED 4K Fire TV',
        subtitle: 'MiniLED ULED 4K Fire TV',
        series: 'QD7 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class QD7 Series MiniLED ULED 4K Fire TV</p>',
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
        overseasModel: 'QD7',
        factoryModel: 'QD7QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '85',
      },
      {
        sku: '100QD6QF',
        spu: '100QD6QF',
        erpcode: null,
        title: 'Hisense 100" Class QD6 Series Hi-QLED 4K Fire TV',
        subtitle: 'Hisense 100" Class QD6 Series Hi-QLED 4K Fire TV',
        series: 'QD6 Series',
        description_description: {
          html: '<p>Hisense 100&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
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
        overseasModel: 'QD6',
        factoryModel: 'QD6QF',
        whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-100-class-qd6-series-hi-qled-4k-fire-tv-100qd6qf',
        faqLink: null,
        size: '100',
      },
      {
        sku: '43QD6QF',
        spu: '43QD6QF',
        erpcode: null,
        title: 'Hisense 43" Class QD6 Series Hi-QLED 4K Fire TV',
        subtitle: 'Hisense 43" Class QD6 Series Hi-QLED 4K Fire TV',
        series: 'QD6 Series',
        description_description: {
          html: '<p>Hisense 43&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
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
        overseasModel: 'QD6',
        factoryModel: 'QD6QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '43',
      },
      {
        sku: '50QD6QF',
        spu: '50QD6QF',
        erpcode: null,
        title: 'Hisense 50" Class QD6 Series Hi-QLED 4K Fire TV',
        subtitle: 'Hisense 50" Class QD6 Series Hi-QLED 4K Fire TV',
        series: 'QD6 Series',
        description_description: {
          html: '<p>Hisense 50&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
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
        overseasModel: 'QD6',
        factoryModel: 'QD6QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '50',
      },
      {
        sku: '55QD6QF',
        spu: '55QD6QF',
        erpcode: null,
        title: 'Hisense 55" Class QD6 Series Hi-QLED 4K Fire TV',
        subtitle: 'Hisense 55" Class QD6 Series Hi-QLED 4K Fire TV',
        series: 'QD6 Series',
        description_description: {
          html: '<p>Hisense 55&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
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
        overseasModel: 'QD6',
        factoryModel: 'QD6QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '55',
      },
      {
        sku: '65QD6QF',
        spu: '65QD6QF',
        erpcode: null,
        title: 'Hisense 65" Class QD6 Series Hi-QLED 4K Fire TV',
        subtitle: 'Hisense 65" Class QD6 Series Hi-QLED 4K Fire TV',
        series: 'QD6 Series',
        description_description: {
          html: '<p>Hisense 65&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
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
        overseasModel: 'QD6',
        factoryModel: 'QD6QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '65',
      },
      {
        sku: '75QD6QF',
        spu: '75QD6QF',
        erpcode: null,
        title: 'Hisense 75" Class QD6 Series Hi-QLED 4K Fire TV',
        subtitle: 'Hisense 75" Class QD6 Series Hi-QLED 4K Fire TV',
        series: 'QD6 Series',
        description_description: {
          html: '<p>Hisense 75&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
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
        overseasModel: 'QD6',
        factoryModel: 'QD6QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '75',
      },
      {
        sku: '85QD6QF',
        spu: '85QD6QF',
        erpcode: null,
        title: 'Hisense 85" Class QD6 Series Hi-QLED 4K Fire TV',
        subtitle: 'Hisense 85" Class QD6 Series Hi-QLED 4K Fire TV',
        series: 'QD6 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class QD6 Series Hi-QLED 4K Fire TV</p>',
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
        overseasModel: 'QD6',
        factoryModel: 'QD6QF',
        whereToBuyLink: null,
        faqLink: null,
        size: '85',
      },
      {
        sku: '55U6N',
        spu: '55U6N',
        erpcode: null,
        title: 'Hisense 55" Class U6 Series Mini-LED ULED 4K Google TV',
        subtitle: 'Hisense 55" Class U6 Series Mini-LED ULED 4K Google TV',
        series: 'U6 Series',
        description_description: {
          html: '<p>Hisense 55&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
        overseasModel: 'U6',
        factoryModel: 'U6N',
        whereToBuyLink: null,
        faqLink: null,
        size: '55',
      },
      {
        sku: '65U6N',
        spu: '65U6N',
        erpcode: null,
        title: 'Hisense 65" Class U6 Series Mini-LED ULED 4K Google TV',
        subtitle: 'Hisense 65" Class U6 Series Mini-LED ULED 4K Google TV',
        series: 'U6 Series',
        description_description: {
          html: '<p>Hisense 65&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
        overseasModel: 'U6',
        factoryModel: 'U6N',
        whereToBuyLink: null,
        faqLink: null,
        size: '65',
      },
      {
        sku: '75U6N',
        spu: '75U6N',
        erpcode: null,
        title: 'Hisense 75" Class U6 Series Mini-LED ULED 4K Google TV',
        subtitle: 'Hisense 75" Class U6 Series Mini-LED ULED 4K Google TV',
        series: 'U6 Series',
        description_description: {
          html: '<p>Hisense 75&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
        overseasModel: 'U6',
        factoryModel: 'U6N',
        whereToBuyLink: null,
        faqLink: null,
        size: '75',
      },
      {
        sku: '85U6N',
        spu: '85U6N',
        erpcode: null,
        title: 'Hisense 85" Class U6 Series Mini-LED ULED 4K Google TV',
        subtitle: 'Hisense 85" Class U6 Series Mini-LED ULED 4K Google TV',
        series: 'U6 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class U6 Series Mini-LED ULED 4K Google TV</p>',
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
        overseasModel: 'U6',
        factoryModel: 'U6N',
        whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-65-class-u6-series-mini-led-uled-4k-google-tv-65u6n',
        faqLink: null,
        size: '85',
      },
      {
        sku: '100U75QG',
        spu: '100U75QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U7 Series',
        description_description: {
          html: '<p>Hisense 100&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U7',
        factoryModel: 'U75QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '100',
      },
      {
        sku: '116U75QG',
        spu: '116U75QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U7 Series',
        description_description: {
          html: '<p>Hisense 116&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U7',
        factoryModel: 'U75QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '116',
      },
      {
        sku: '55U75QG',
        spu: '55U75QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U7 Series',
        description_description: {
          html: '<p>Hisense 55&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U7',
        factoryModel: 'U75QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '55',
      },
      {
        sku: '75U75QG',
        spu: '75U75QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U7 Series',
        description_description: {
          html: '<p>Hisense 75&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U7',
        factoryModel: 'U75QG',
        whereToBuyLink: '/us/en/tv/miniled/u7/75.html',
        faqLink: null,
        size: '75',
      },
      {
        sku: '85U75QG',
        spu: '85U75QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U7 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U7',
        factoryModel: 'U75QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '85',
      },
      {
        sku: '65U75QG',
        spu: '65U75QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U7 Series',
        description_description: {
          html: '<p>Hisense 65&#34; Class U7 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U7',
        factoryModel: 'U75QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '65',
      },
      {
        sku: '100U8QG',
        spu: '100U8QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U8 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U8',
        factoryModel: 'U8QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '100',
      },
      {
        sku: '65U8QG',
        spu: '65U8QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U8 Series',
        description_description: {
          html: '<p>Hisense 65&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U8',
        factoryModel: 'U8QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '65',
      },
      {
        sku: '75U8QG',
        spu: '75U8QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U8 Series',
        description_description: {
          html: '<p>Hisense 75&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U8',
        factoryModel: 'U8QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '75',
      },
      {
        sku: '85U8QG',
        spu: '85U8QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U8 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U8',
        factoryModel: 'U8QG',
        whereToBuyLink: null,
        faqLink: null,
        size: '85',
      },
      {
        sku: '55U8QG',
        spu: '55U8QG',
        erpcode: null,
        title: 'MiniLED ULED 4K Google TV',
        subtitle: 'MiniLED ULED 4K Google TV',
        series: 'U8 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class U8 Series MiniLED ULED 4K Google TV</p>',
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
        overseasModel: 'U8',
        factoryModel: 'U8QG',
        whereToBuyLink: '/us/en/tv/miniled/u8/75.html',
        faqLink: null,
        size: '55',
      },
      {
        sku: '75U9N',
        spu: '75U9N',
        erpcode: null,
        title: 'Hisense 75" Class U9 Series Mini-LED QLED 4K Google TV',
        subtitle: 'Hisense 75" Class U9 Series Mini-LED QLED 4K Google TV',
        series: 'U9 Series',
        description_description: {
          html: '<p>Hisense 75&#34; Class U9 Series Mini-LED QLED 4K Google TV</p>',
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
        overseasModel: 'U9',
        factoryModel: 'U9N',
        whereToBuyLink: null,
        faqLink: null,
        size: '75',
      },
      {
        sku: '85U9N',
        spu: '85U9N',
        erpcode: null,
        title: 'Hisense 85" Class U9 Series Mini-LED QLED 4K Google TV',
        subtitle: 'Hisense 85" Class U9 Series Mini-LED QLED 4K Google TV',
        series: 'U9 Series',
        description_description: {
          html: '<p>Hisense 85&#34; Class U9 Series Mini-LED QLED 4K Google TV</p>',
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
        overseasModel: 'U9',
        factoryModel: 'U9N',
        whereToBuyLink: 'https://www.hisense-usa.com/product-page/televisions-75-class-u9-series-mini-led-qled-4k-google-tv-75u9n',
        faqLink: null,
        size: '85',
      },
      {
        sku: '116UXQUA',
        spu: '116UXQUA',
        erpcode: null,
        title: 'RGB MiniLED ULED 4K Google TV',
        subtitle: 'RGB MiniLED ULED 4K Google TV',
        series: 'UX Series',
        description_description: {
          html: '<p>Hisense 116” Class UX Series RGB MiniLEDULED 4K Google TV</p>',
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
        overseasModel: '116UXQUA',
        factoryModel: '116UXQUA',
        whereToBuyLink: '/us/en/tv/miniled/ux/116.html',
        faqLink: null,
        size: '116',
      },
    ],
    ':type': 'sheet',
  };

  fetch(graphqlUrl)
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      const items = (data && data.data) || [];
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
      const items = (mockData && mockData.data) || [];
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
window.useShortDescriptionAsImage = false;

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
