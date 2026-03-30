export default async function decorate(block) {
  console.log(block, 'block');
  const mockData = [
    {
      product_category: 'Television',
      product_subcategory: 'Television',
      warranty_info_icon: 'http://localhost:3000/us/en/support/media_1412a0c4…4418.svg?width=2000&format=webply&optimize=medium',
      warranty_info_title: '2 Year Panel & Parts Warranty',
      warranty_info: '1',
      warranty_info_notes: '<ul><li>On-site service included for units 43" and above</li><li>Dead pixel policy: 3 or more bright/dead pixels qualifies for replacement</li><li>Original packaging recommended for service pickup</li></ul>',
      warranty_info_additional: 'Exchange Only',
    },
    {
      product_category: 'Audio',
      product_subcategory: 'Audio',
      warranty_info_icon: '🎵',
      warranty_info_title: '18 Month Audio Warranty',
      warranty_info: '2',
      warranty_info_notes: '<p><strong>Warranty Terms:</strong></p><p>• Physical damage, water exposure, and unauthorized repairs void coverage<br>• Ear pads, batteries, and cables: 90-day limited coverage</p>',
      warranty_info_additional: 'Exchange Only',
    },
    {
      product_category: 'Laser home cinema',
      product_subcategory: 'Laser home cinema',
      warranty_info_icon: '🎥',
      warranty_info_title: '3 Year Laser Projector Warranty',
      warranty_info: '1',
      warranty_info_notes: '<div style="background:#f9f9f9; padding:10px; border-radius:4px;"><strong>Included:</strong> Parts, labor, and firmware updates<br><strong>Not included:</strong> Remote control, HDMI cables, lens cleaning</div>',
      warranty_info_additional: 'Exchange Only',
    },
    {
      product_category: 'Appliances',
      product_subcategory: 'Refrigerators',
      warranty_info_icon: '❄️',
      warranty_info_title: '2 Year Full + 8 Year Sealed System Warranty',
      warranty_info: '3',
      warranty_info_notes: '<ul><li><b>Years 1-2:</b> Parts, labor, and transportation included</li><li><b>Years 3-10:</b> Compressor, condenser, evaporator parts only</li><li>Professional installation required for warranty validity</li></ul>',
      warranty_info_additional: 'Exchange Only',
    },
    {
      product_category: 'Air products',
      product_subcategory: 'Air products',
      warranty_info_icon: '💨',
      warranty_info_title: '2 Year Air Purifier Warranty',
      warranty_info: '3.',
      warranty_info_notes: '<p><em>Filter replacements are not covered under warranty.</em></p><p>✔ HEPA filter: replace every 12 months<br>✔ Carbon pre-filter: replace every 6 months</p>',
      warranty_info_additional: 'Exchange Only',
    },
    {
      product_category: 'Commercial',
      product_subcategory: 'Commercial Display',
      warranty_info_icon: '🖥️',
      warranty_info_title: '3 Year Commercial Display Warranty',
      warranty_info: '1',
      warranty_info_notes: '<div style="border-left:3px solid #0073aa; padding-left:12px;"><strong>Commercial Use Conditions:</strong><ul><li>24/7 operation supported — warranty valid for continuous use</li></ul></div>',
      warranty_info_additional: 'Exchange Only',
    },
  ];
  const warrantyWrapper = document.createElement('div');
  warrantyWrapper.className = 'warranty-wrapper';
  // category tab 切换盒子
  const warrantyCategoryDiv = document.createElement('ul');
  warrantyCategoryDiv.className = 'warranty-category-box';
  // warranty cards 盒子
  const cardsBox = document.createElement('div');
  cardsBox.className = 'warranty-cards-box';
  const cardsGrid = document.createElement('div');
  cardsGrid.className = 'warranty-cards';
  const warrantyLoadMore = document.createElement('div');
  warrantyLoadMore.className = 'warranty-load-more';
  let currentPage = 1; // 当前页码
  const loadMoreStep = 9; // 分布数量
  let loadMoreTextContent = null;
  let allWarrantyData = []; // 存储所有聚合后的数据
  let allWarrantyCategory = []; // 所有 warranty category

  const rows = [...(block.children || [])];
  rows.forEach((row, index) => {
    if (index === 0) {
      // 获取 load more 文案
      const text = row.textContent && row.textContent.trim();
      if (text) {
        loadMoreTextContent = text;
      }
    }
  });

  const moreSpan = document.createElement('span');
  moreSpan.textContent = loadMoreTextContent || 'Load more';
  warrantyLoadMore.append(moreSpan);

  cardsBox.append(cardsGrid, warrantyLoadMore);
  warrantyWrapper.append(warrantyCategoryDiv, cardsBox);
  block.replaceChildren(warrantyWrapper);

  // 修改：Load More 点击逻辑
  warrantyLoadMore.addEventListener('click', () => {
    currentPage += 1;
    // eslint-disable-next-line no-use-before-define
    renderWarrantyCards();
    // 更新Load More显示状态
    // eslint-disable-next-line no-use-before-define
    updateLoadMoreVisibility();
  });

  // 渲染 category tab dom
  function renderCategoryTab() {
    // const categoryBox = document.createElement('div');
    // categoryBox.className = 'warranty-category-box';
    allWarrantyCategory.forEach((item, index) => {
      const categoryItem = document.createElement('li');
      categoryItem.className = 'category-item';
      categoryItem.textContent = item;
      categoryItem.setAttribute('data-category', item);
      if (index === 0) {
        categoryItem.classList.add('category-item-active');
      }
      warrantyCategoryDiv.append(categoryItem);
    });
    // warrantyCategory.append(categoryBox);
  }

  // 渲染 warranty card item
  function renderWarrantyCards() {
    allWarrantyData.forEach((item) => {
      const cardItem = document.createElement('div');
      cardItem.className = 'card-item';
      const cardTopBox = document.createElement('div');
      cardTopBox.className = 'card-top-box';

      // card num
      const topLeftBox = document.createElement('div');
      topLeftBox.className = 'top-left-box';
      const topLeft = document.createElement('div');
      topLeft.className = 'top-left';
      const numSpan = document.createElement('span');
      numSpan.className = 'card-num';
      numSpan.textContent = item.warranty_info;
      const unitSpan = document.createElement('span');
      unitSpan.className = 'card-unit';
      topLeft.append(numSpan, unitSpan);

      // card tips
      const exchangeDiv = document.createElement('div');
      exchangeDiv.className = 'exchange-div';
      exchangeDiv.textContent = item.warranty_info_additional;

      topLeftBox.append(topLeft, exchangeDiv);

      // card icon
      const cardIconBox = document.createElement('div');
      cardIconBox.className = 'card-icon-box';
      const cardIcon = document.createElement('img');
      cardIcon.src = item.warranty_info_icon;
      cardIconBox.append(cardIcon);

      cardTopBox.append(topLeftBox, cardIconBox);

      // card title
      const cardTitle = document.createElement('div');
      cardTitle.className = 'card-title';
      cardTitle.textContent = item.product_subcategory;
      // card notes
      const cardNotes = document.createElement('div');
      cardNotes.className = 'card-notes';
      cardNotes.innerHTML = item.warranty_info_notes;

      cardItem.append(cardTopBox, cardTitle, cardNotes);
      cardsGrid.append(cardItem);
    });
  }

  // 处理原始数据
  function originDataUtils() {
    allWarrantyData = JSON.parse(JSON.stringify(mockData));
    // 过滤所有 category
    allWarrantyCategory = allWarrantyData.map((item) => item.product_category);
    const allCategoryTabLabel = 'All Warranties';
    allWarrantyCategory = [allCategoryTabLabel, ...allWarrantyCategory];
    console.log(allWarrantyCategory);
    // 渲染 category tab
    renderCategoryTab();

    // 如返回warranty list 数据还需要其他处理，在这里进行数据整合
    // allWarrantyData
    // 渲染 card list
    renderWarrantyCards();
  }

  function initRenderDom() {
    originDataUtils();
  }

  initRenderDom();

  // 新增：更新Load More按钮显示状态
  function updateLoadMoreVisibility() {
    const totalPages = Math.ceil(allWarrantyData.length / loadMoreStep);
    if (currentPage >= totalPages) {
      warrantyLoadMore.style.display = 'none';
    } else {
      warrantyLoadMore.style.display = 'block';
    }
  }
}

// fetch(getGraphQLUrl(graphqlUrl))
//   .then((resp) => {
//     if (!resp.ok) throw new Error('Network response not ok');
//     return resp.json();
//   })
//   .then((data) => {

//   })
//   .catch(() => {
//     const items = (mockData && mockData.data) || [];

//   });
