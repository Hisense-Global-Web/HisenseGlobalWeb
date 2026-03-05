/**
 * 比较商品popup 相关逻辑 --- start
 */

/**
 * 强化版属性名标准化：统一小写 + 移除前后空格
 * @param {string} key - 原始属性名
 * @returns {string} 标准化后的属性名
 */
function normalizeKey(key) {
  const normalized = key
    .toLowerCase() // 1. 统一转为小写
    // .replace(/\([^)]*\)|（[^）]*）/g, '') // 2. 去除中英文括号及括号内内容
    .trim(); // 3.去除首尾空格
  return normalized;
}

/**
 * 解析单个商品的属性，转为 {标准化属性名: 属性值} 的对象
 * @param {Array} productAttrs - 单个商品的属性数组
 * @returns {Object} 结构化的商品属性对象
 */
function parseProductAttrs(productAttrs) {
  const attrObj = {};
  productAttrs.forEach((attrStr) => {
    // 匹配 :: 或 : 分隔符
    const sepIndex = attrStr.includes('::') ? attrStr.indexOf('::') : attrStr.indexOf(':');
    if (sepIndex === -1) return; // 无分隔符则跳过

    // 拆分属性名和值（去除首尾空格）
    const [rawKey, value] = attrStr.split('::');
    // 标准化属性名并存储
    const normKey = normalizeKey(rawKey);
    attrObj[normKey] = value;
  });
  return attrObj;
}

/**
 * 聚合多商品属性，确保属性值数组长度与商品数一致（无值填"-"）
 * @param {Array} productsData - 原始商品数据
 * @returns {Array} 聚合后的最终数据 [{属性名: [值1, 值2, 值3]}, ...]
 */
function comparePropertyData(allAttributesArr) {
  // 1. 解析所有商品为结构化对象
  const parsedProducts = allAttributesArr.map(parseProductAttrs);
  const productCount = parsedProducts.length;

  // 2. 收集所有商品的标准化属性名（去重）
  const allAttrKeys = new Set();
  parsedProducts.forEach((product) => {
    Object.keys(product).forEach((key) => allAttrKeys.add(key));
  });

  // 3. 遍历每个属性名，为每个商品填充值（无则填"-"）
  const result = [];
  allAttrKeys.forEach((key) => {
    const values = [];
    for (let i = 0; i < productCount; i += 1) {
      // 存在则取属性值，否则填"-"
      values.push(parsedProducts[i][key] || '-');
    }
    // 按指定格式存储
    result.push({ [key]: values });
  });

  return result;
}
const country = window.location.pathname.split('/').filter(Boolean)[0] || '';
/**
 * 解析并聚合数据
 * @param {Array} compareDataArr - 原始数据源
 * @returns {Array} 聚合后的数组
 */
export function aggregateData(compareDataArr) {
  const cloneCompareDataArr = JSON.parse(JSON.stringify(compareDataArr));
  const allProductNameArr = []; // 所有比较商品的名字集合
  let tempCompareInfoObj = {}; // 比较信息对象包含：比较商品名称集合、比较商品属性集合
  const allAttrsArr = []; // 所有商品属性集合

  cloneCompareDataArr.forEach((compareDataItem) => {
    const itemAttrArr = []; // 每个商品的属性集合
    // 整合比较数据中的名字
    if (compareDataItem.series || compareDataItem.title) {
      allProductNameArr.push({
        productName: compareDataItem.title,
        productSeries: compareDataItem.series,
      });
    }
    // 整合比较数据的所有属性
    for (let i = 1; i <= 20; i += 1) {
      const labelKey = `specificationsGroup${i}Label`;
      const attrKey = `specificationsGroup${i}Attribute`;
      if (compareDataItem[labelKey] && compareDataItem[attrKey] && Array.isArray(compareDataItem[attrKey])) {
        const attributes = compareDataItem[attrKey];
        // 所属属性集合
        itemAttrArr.push(attributes);
      }
    }
    allAttrsArr.push(itemAttrArr.flat());
  });
  const comparePropertyArr = comparePropertyData(allAttrsArr); // 将相同属性归类到同一数组中
  tempCompareInfoObj = {
    compareTit: allProductNameArr,
    compareProperty: comparePropertyArr,
  };
  return tempCompareInfoObj;
}

/**
 * 渲染数据到页面
 * @param {Array} aggregatedData - 聚合后的数据
 * @param {string} containerId - 容器ID
 */
export function renderCompareDetailData(compareDetailInfo, containerId) {
  const { compareTit, compareProperty } = compareDetailInfo;
  const container = document.getElementById(containerId);
  const nameBoxEl = document.querySelector('.product-name-box');
  if (!container) return;

  // 清空容器
  container.innerHTML = '';
  nameBoxEl.innerHTML = '';

  compareTit.forEach((titItem) => {
    // 创建属性项容器
    const nameItemDiv = document.createElement('div');
    nameItemDiv.className = 'product-title-item';
    nameItemDiv.style.width = compareTit.length === 2 ? '50%' : '33%';
    // 创建产品名字
    const nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    nameDiv.textContent = titItem.productName;

    // 创建产品系列
    const seriesDiv = document.createElement('div');
    seriesDiv.className = 'product-series';
    seriesDiv.textContent = titItem.productSeries;

    nameItemDiv.appendChild(seriesDiv);
    nameItemDiv.appendChild(nameDiv);
    nameBoxEl.append(nameItemDiv);
  });

  // 遍历聚合数据，生成DOM
  compareProperty.forEach((item) => {
    // 获取属性名和值数组
    const [key] = Object.keys(item);
    const values = item[key];

    // 创建属性项容器
    const itemDiv = document.createElement('div');
    itemDiv.className = 'property-item';

    // 创建标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'property-title';
    titleDiv.textContent = key;

    // 创建值列表
    const valuesDiv = document.createElement('div');
    valuesDiv.className = 'values-list';
    // 遍历值数组创建每个值的展示项
    values.forEach((value) => {
      const valueDiv = document.createElement('div');
      valueDiv.className = 'value-item';
      valueDiv.style.width = compareTit.length === 2 ? '50%' : '33%';
      valueDiv.textContent = value;
      valuesDiv.appendChild(valueDiv);
    });

    // 组装DOM
    itemDiv.appendChild(titleDiv);
    itemDiv.appendChild(valuesDiv);
    container.append(itemDiv);
  });
}

// 比较弹窗详细信息
export function createComparePopup() {
  const comparePopupWrapperEl = document.createElement('div');
  comparePopupWrapperEl.className = 'compare-popup-wrapper';
  const comparePopupContainerEl = document.createElement('div');
  comparePopupContainerEl.className = 'compare-popup-container';
  const comparePopupTitBoxEl = document.createElement('div');
  // add card item close button
  const popupCloseBtn = document.createElement('div');
  popupCloseBtn.className = 'compare-popup-close';
  const closeIcon = document.createElement('img');
  closeIcon.src = `/content/dam/hisense/${country}/common-icons/close-50.svg`;
  closeIcon.alt = 'Close';
  popupCloseBtn.append(closeIcon);
  // popup close click
  popupCloseBtn.addEventListener('click', () => {
    document.body.style.overflow = 'auto';
    document.querySelector('.compare-popup-wrapper').style.display = 'none';
  });
  // popup title
  comparePopupTitBoxEl.className = 'compare-popup-tit-box';
  const comparePopupTitEl = document.createElement('div');
  comparePopupTitEl.className = 'popup-tit';
  comparePopupTitEl.textContent = 'Compare TV Models';
  const comparePopupTitTipsEl = document.createElement('div');
  comparePopupTitTipsEl.className = 'popup-tit-tip';
  comparePopupTitTipsEl.textContent = 'Compare features and find your fit.';
  comparePopupTitBoxEl.append(comparePopupTitEl, comparePopupTitTipsEl);
  // popup compare product name
  const compareProductNameBoxEl = document.createElement('div');
  compareProductNameBoxEl.className = 'product-name-box';

  // 对比商品详情信息
  const productMainInfoBoxEl = document.createElement('div');
  productMainInfoBoxEl.className = 'product-main-info-box';
  // productMainInfoBoxEl.setAttribute('id', 'compare-data-detail');

  // 对比商品 card 集合
  const productCardBoxEl = document.createElement('div');
  productCardBoxEl.className = 'product-card-box';

  // 对比商品属性集合
  const propertyBoxEl = document.createElement('div');
  propertyBoxEl.className = 'property-box';
  propertyBoxEl.setAttribute('id', 'property-box-id');

  // 主体信息盒子里，追加 card 集合、specifications 集合
  // productMainInfoBoxEl.append(productCardBoxEl, productSpecificationsBoxEl);
  productMainInfoBoxEl.append(productCardBoxEl, propertyBoxEl);
  // 为container 追加 popup title, card box, main info
  comparePopupContainerEl.append(comparePopupTitBoxEl, compareProductNameBoxEl, productMainInfoBoxEl, popupCloseBtn);
  comparePopupWrapperEl.append(comparePopupContainerEl);
  document.body.append(comparePopupWrapperEl);
}

/**
 * 比较商品popup 相关逻辑 --- end
 */

/**
 * plp 页面底部固定比较栏相关逻辑 ---- start
 */
export const compareLiAppendType = {
  initCompareLi: 'initCompareLi', // 初始化比较栏li
  addEmptyLi: 'addEmptyLi', // 添加空 li 元素（显示加号的li）
};

// 创建比较数据的li 元素
export function createCompareLiEl(appendType) {
  const compareCardItem = document.createElement('li');
  compareCardItem.className = 'plp-compare-card-item';
  // add image load box
  const compareImgLoadBox = document.createElement('div');
  compareImgLoadBox.className = 'plp-compare-card-img-load';
  // 比较产品的图片放在这个加载框里，默认是空的，用户点击添加比较时才会加载对应产品的图片
  const compareImgBox = document.createElement('div');
  compareImgBox.className = 'compare-img-box';
  const compareImg = document.createElement('img');
  const compareProductTitle = document.createElement('span');
  compareProductTitle.className = 'compare-product-title';
  // add card item close button
  const itemCloseBtn = document.createElement('div');
  itemCloseBtn.className = 'plp-compare-card-close';
  const closeIcon = document.createElement('img');
  closeIcon.src = `/content/dam/hisense/${country}/common-icons/close-50.svg`;
  closeIcon.alt = 'Close';
  itemCloseBtn.append(closeIcon);
  compareImgBox.append(compareImg, compareProductTitle, itemCloseBtn);
  // add plus image to indicate adding compare item
  const cardPlusImage = document.createElement('div');
  cardPlusImage.className = 'plp-compare-card-plus-box';
  const plusIcon = document.createElement('img');
  plusIcon.className = 'plp-compare-card-plus';
  plusIcon.src = `/content/dam/hisense/${country}/common-icons/plus-grey30.png`;
  cardPlusImage.appendChild(plusIcon);
  compareImgLoadBox.append(compareImgBox, cardPlusImage);
  compareCardItem.append(compareImgLoadBox);
  const compareCardsEl = document.querySelector('.plp-compare-cards');
  if (appendType === compareLiAppendType.initCompareLi) {
    // 初始化默认追加三个 li 元素
    for (let i = 0; i < 3; i += 1) {
      compareCardsEl.appendChild(compareCardItem.cloneNode(true));
    }
  } else {
    // 手动切换删除比较产品时，要再动态添加一个空的 显示加号的 li,
    compareCardsEl.appendChild(compareCardItem);
  }
}

// 为对应比较产品设置 图片与title
export function setCompareProductImgTit(targetEl, productInfo) {
  targetEl.classList.add('active-compare');
  targetEl.setAttribute('data-compare-id', productInfo.sku || '');
  const pPath = Object.keys(productInfo.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
  targetEl.querySelector('.compare-img-box img').src = productInfo.mediaGallery_image ? productInfo.mediaGallery_image[pPath] : '';
  targetEl.querySelector('.compare-product-title').textContent = productInfo.title;
}

// 追加比较产品空的带加号的 li
export function appendCompareProductUtil() {
  // item add image load box
  const compareCardsEl = document.querySelector('.plp-compare-cards');
  const compareCardListLiAll = compareCardsEl.querySelectorAll('li');
  if (compareCardListLiAll.length >= 3) return;
  // 手动删除询问固定栏中已选择的产品，或取消plp product card 上 【Compare】 按钮选中状态，需要创建一个空的只显示 加号的 li 元素
  createCompareLiEl(compareLiAppendType.addEmptyLi);
}

/**
 * plp 页面底部固定比较栏相关逻辑 ---- end
 */
