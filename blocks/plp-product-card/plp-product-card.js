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
        if (variantImg) {
          imgDiv.style.backgroundImage = `url(${variantImg})`;
        } else {
          imgDiv.style.backgroundImage = '';
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
            _path: '/content/dam/hisense/content-fragments/product-model/us/-TELEVISIONS/4k-uled/75-u-65-qf-43',
            _metadata: { stringMetadata: [{ name: 'title', value: '75U65QF-43' }] },
            title: 'Hisense 43" Class U6',
            series: '4K ULED',
            size: '43"',
            priceInfo_regularPrice: 30000,
            priceInfo_specialprice: 18000,
            productLaunchDate: '2025-12-17T16:00:00.000Z',
            mediaGallery_image: { _path: '/content/dam/hisense/image/product/75u65qf/991681.jpg' },
            whereToBuyLink: 'http://amazon.com/dp/B0DN6THH67',
            tags: [
              'hisense:product/tv/audio/dolby',
              'hisense:product/tv/refresh-rate/180hz',
              'hisense:product/tv/refresh-rate/60hz',
              'hisense:product/tv/resolution/fhd',
              'hisense:product/tv/screen-size/50',
              'hisense:product/tv/screen-size/50-65',
              'hisense:product/tv/type/rgb-miniled',
              'hisense:product/tv/type/oled',
            ],
            spu: '75U65QF',
          },
          {
            _path: '/content/dam/hisense/content-fragments/product-model/us/-TELEVISIONS/4k-uled/75-u-65-qf-50',
            _metadata: { stringMetadata: [{ name: 'title', value: '75U65QF-50' }] },
            title: 'Hisense 50" Class U6 Series MiniLED ULED 4K Fire TV',
            series: '4K ULED',
            size: '50"',
            priceInfo_regularPrice: 20000,
            priceInfo_specialprice: 18000,
            productLaunchDate: '2025-12-17T16:00:00.000Z',
            mediaGallery_image: { _path: '/content/dam/hisense/image/product/75u65qf/991681.jpg' },
            tags: [
              'hisense:product/tv/screen-size/50',
              'hisense:product/tv/resolution/fhd',
              'hisense:product/tv/resolution/hd',
              'hisense:product/tv/resolution/uhd',
              'hisense:product/tv/operating-system',
              'hisense:product/tv/operating-system/fire-tv',
              'hisense:product/tv/operating-system/google-tv',
              'hisense:product/tv/operating-system/vidda-tv ',
              'hisense:product/tv/audio',
              'hisense:product/tv/audio/dolby',
              'hisense:product/tv/refresh-rate',
              'hisense:product/tv/refresh-rate/144hz',
              'hisense:product/tv/refresh-rate/165hz',
              'hisense:product/tv/refresh-rate/180hz',
            ],
            spu: '75U65QF',
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
