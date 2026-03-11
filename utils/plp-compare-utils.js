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
const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
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
  const allProductImgArr = []; // 所有商品图片集合

  cloneCompareDataArr.forEach((compareDataItem) => {
    const itemAttrArr = []; // 每个商品的属性集合

    // 整合比较数据中的名字
    if (compareDataItem.series || compareDataItem.title) {
      allProductNameArr.push({
        productName: compareDataItem.title,
        productSeries: compareDataItem.series,
      });
    }
    // 对比商品图片
    let pPath = '';
    if (compareDataItem.mediaGallery_image) {
      // 容错处理，如果接口返回图片字段再给src 赋值
      pPath = Object.keys(compareDataItem.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
    }
    allProductImgArr.push({
      imgSrc: compareDataItem.mediaGallery_image ? compareDataItem.mediaGallery_image[pPath] : '',
    });
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
    compareImg: allProductImgArr,
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
  const { compareTit, compareImg, compareProperty } = compareDetailInfo;
  const container = document.getElementById(containerId);
  const nameBoxEl = document.querySelector('.product-name-box');
  const imgWrapperEl = document.querySelector('.popup-img-wrapper');
  if (!container) return;

  // 清空容器
  container.innerHTML = '';
  nameBoxEl.innerHTML = '';
  imgWrapperEl.innerHTML = '';

  // 对比产品名字
  compareTit.forEach((titItem) => {
    // 创建属性项容器
    const nameItemDiv = document.createElement('div');
    nameItemDiv.className = 'product-title-item';
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

  // 对比产品图片
  compareImg.forEach((imgItem) => {
    const imgItemDiv = document.createElement('div');
    imgItemDiv.className = 'popup-img-item';
    const imgBoxEl = document.createElement('div');
    imgBoxEl.className = 'img-box';
    const imgEl = document.createElement('img');
    imgEl.src = imgItem.imgSrc;
    imgBoxEl.append(imgEl);
    imgItemDiv.append(imgBoxEl);
    imgWrapperEl.appendChild(imgItemDiv);
  });

  // 对比属性，遍历聚合数据，生成DOM
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
      valueDiv.textContent = value;
      valuesDiv.appendChild(valueDiv);
    });

    // 组装DOM
    itemDiv.appendChild(titleDiv);
    itemDiv.appendChild(valuesDiv);
    container.append(itemDiv);
  });
}

// popup scroll box 滚动时，popup 中产品名称需要吸顶
function comparePopupScroll() {
  // 获取元素 popup 产品名称相对于滚动容器的顶部偏移量
  const nameBoxEl = document.querySelector('.product-name-box');
  const scrollBoxEl = document.querySelector('.popup-scroll-box');
  const nameBoxElTop = nameBoxEl.getBoundingClientRect().top;
  // 获取滚动容器相对于视口的顶部偏移量
  const scrollBoxTop = scrollBoxEl.getBoundingClientRect().top;

  // 计算元素产品名称相对于滚动容器的内部偏移：当差值≤0时，元素B触顶
  const relativeTop = nameBoxElTop - scrollBoxTop;

  // 控制激活类名：触顶时添加边框，否则移除
  if (relativeTop <= 0) {
    nameBoxEl.classList.add('sticky-active');
  } else {
    nameBoxEl.classList.remove('sticky-active');
  }
}

// mobile 端， popup 左滑、右滑只能滑动指定距离
function mobilePopupTouchStartEnd() {
  // 1. 获取目标滚动容器
  const scrollContainer = document.querySelector('.popup-scroll-box');

  // 最小滑动距离（过滤误触，单位px）
  const MIN_SWIPE_DISTANCE = 80;

  // 2. 定义变量存储滑动状态
  let startX = 0; // 滑动起点X坐标
  let startY = 0; // 滑动起点Y坐标
  let isSwiping = false; // 是否正在滑动
  let isHorizontalSwipe = false; // 新增：标记是否为横向滑动

  /**
   * 处理滑动开始事件
   * @param {Event} e - 事件对象
   */
  function handleStart(e) {
    // 获取起点坐标（兼容touch和mouse事件）
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    // 初始化状态
    startX = clientX;
    startY = clientY;
    isSwiping = true;
    isHorizontalSwipe = false; // 重置横向滑动标记
  }

  /**
   * 处理滑动结束事件（核心：判断方向+执行滚动）
   * @param {Event} e - 事件对象
   */
  function handleEnd(e) {
    if (!isSwiping) return;

    // 获取终点坐标
    const clientX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.type === 'touchend' ? e.changedTouches[0].clientY : e.clientY;

    // 计算滑动偏移量
    const deltaX = clientX - startX; // X轴偏移（正值=右滑，负值=左滑）
    const deltaY = clientY - startY; // Y轴偏移

    // 过滤无效滑动：横向滑动距离需大于纵向，且超过最小距离
    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE || Math.abs(deltaX) < Math.abs(deltaY)) {
      // alert(`${deltaX} x轴滑动偏移量`);
      // alert(`${deltaY} y轴滑动偏移量`);
      isSwiping = false;
      return;
    }

    // 6. 判断滑动方向并执行滚动
    // 只处理横向滑动：必须满足横向滑动标记 且 滑动距离足够
    if (isHorizontalSwipe && Math.abs(deltaX) >= MIN_SWIPE_DISTANCE) {
      const currentScrollLeft = scrollContainer.scrollLeft; // 当前滚动距离
      let targetScrollLeft = currentScrollLeft;
      const availableScrollWidth = scrollContainer.scrollWidth;
      const windowW = scrollContainer.clientWidth;
      const SCROLL_DISTANCE = availableScrollWidth - windowW; // 每次滚动可流动距离
      if (deltaX > 0) {
        // 右滑：向左滚动（显示左侧内容）
        // 配置项：每次滑动的滚动距离（可自定义）
        // targetScrollLeft = Math.max(0, currentScrollLeft - SCROLL_DISTANCE);
        targetScrollLeft = SCROLL_DISTANCE * -1;
        // alert(`${targetScrollLeft} 右滑可滑动距离`);
      } else {
        // 左滑：向右滚动（显示右侧内容）
        const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        targetScrollLeft = Math.min(maxScrollLeft, currentScrollLeft + SCROLL_DISTANCE);
        // alert(`${targetScrollLeft} 左滑可滑动距离`);
      }

      // 执行滚动（支持平滑滚动）
      scrollContainer.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth', // 平滑动画，移除则瞬间滚动
      });
    }

    // 重置状态
    isSwiping = false;
  }

  // 3. 监听触摸/鼠标开始事件（兼容移动端+桌面端）
  scrollContainer.addEventListener('touchstart', handleStart);

  // 4. 监听触摸/鼠标移动事件
  scrollContainer.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);
    // 在移动过程中判断滑动方向
    if (!isHorizontalSwipe) {
      if (deltaX > deltaY && deltaX > 10) {
        isHorizontalSwipe = true; // 确定为横向滑动
      }
    }
    // 只有当明显是横向滑动时，才阻止默认行为
    if (isHorizontalSwipe) {
      e.preventDefault();
    }
  }, { passive: false });

  // 5. 监听触摸/鼠标结束事件
  scrollContainer.addEventListener('touchend', handleEnd);
}

// 比较弹窗详细信息
export function createComparePopup() {
  const comparePopupWrapperEl = document.createElement('div');
  comparePopupWrapperEl.className = 'compare-popup-wrapper';
  const comparePopupContainerEl = document.createElement('div');
  comparePopupContainerEl.className = 'compare-popup-container';
  const comparePopupTitBoxEl = document.createElement('div');
  const popupScrollBoxEl = document.createElement('div');
  popupScrollBoxEl.className = 'popup-scroll-box';
  // 监听滚动容器的滚动事件（仅监听弹窗内部滚动，不监听页面滚动）
  popupScrollBoxEl.addEventListener('scroll', comparePopupScroll);
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
    // document.querySelector('.popup-scroll-box').scrollTop = 0
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

  // 对比商品 图片集合
  const imgBoxDiv = document.createElement('div');
  imgBoxDiv.className = 'popup-img-wrapper';

  // 对比商品属性集合
  const propertyBoxEl = document.createElement('div');
  propertyBoxEl.className = 'property-box';
  propertyBoxEl.setAttribute('id', 'property-box-id');

  // 主体信息盒子里，追加 card 集合、specifications 集合
  productMainInfoBoxEl.append(imgBoxDiv, propertyBoxEl);
  // 为container 追加 popup title, card box, main info
  popupScrollBoxEl.append(comparePopupTitBoxEl, compareProductNameBoxEl, productMainInfoBoxEl);
  comparePopupContainerEl.append(popupCloseBtn, popupScrollBoxEl);
  comparePopupWrapperEl.append(comparePopupContainerEl);
  document.body.append(comparePopupWrapperEl);
  // 移动端只滑动指定距离
  mobilePopupTouchStartEnd();
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
  let pPath = '';
  if (productInfo.mediaGallery_image) {
    // 容错处理，如果接口返回图片字段再给src 赋值
    pPath = Object.keys(productInfo.mediaGallery_image).find((k) => k.toLowerCase().includes('_path'));
  }
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
