import { handleCommonDownloadClick } from '../../utils/download.js';
import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';

const GLOBAL_DISPLAY = 'display';
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';

const isAemEnvironment = () => {
  const hostname = window.location.hostname || '';
  return hostname.includes('author') || hostname.includes('publish');
};

function getSearchKeyword() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    sku: urlParams.get('sku') || '',
    category: urlParams.get('category') || '',
  };
}

const getBaseUrl = () => window.GRAPHQL_BASE_URL || '';

const simpleHash = (str) => {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
};

const toAbsoluteUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const shouldPrefixBaseUrl = ['/bin/', '/product/', '/content/dam/']
    .some((prefix) => path.startsWith(prefix));
  if (!shouldPrefixBaseUrl) return path;

  const baseUrl = getBaseUrl();
  if (!baseUrl) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

function getCacheBustedUrl(url) {
  if (!url) return '';
  const cacheBuster = simpleHash(Math.floor(Date.now() / FIVE_MINUTES_MS));
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${cacheBuster}`;
}

async function fetchJson(path) {
  if (!path) return null;

  const url = getCacheBustedUrl(toAbsoluteUrl(path));
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

const getProductEndpoint = (sku) => {
  if (!sku) return '';

  if (isAemEnvironment()) {
    return `/bin/hisense/productListBySku.json?path=/${GLOBAL_DISPLAY}&sku=${encodeURIComponent(sku)}`;
  }

  return `/product/sku/${GLOBAL_DISPLAY}/${sku.replace(/ /g, '+')}.json`;
};

function getSupportEndpoint(factoryModel, category, sku) {
  if (!factoryModel || !category) return '';
  const params = new URLSearchParams({
    factoryModel,
    category,
  });

  const skuParam = sku ? `&sku=${encodeURIComponent(sku)}` : '';
  return `/bin/hisense/support/document.json?${params.toString()}${skuParam}&specialPath=/global`;
}

const getProductInfoBySKU = async (sku) => {
  try {
    const data = await fetchJson(getProductEndpoint(sku));
    return data?.data?.productModelList?.items?.[0] || null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch products by sku:', error);
    return null;
  }
};

const getDisplayManualList = async (factoryModel, category, sku) => {
  try {
    const data = await fetchJson(getSupportEndpoint(factoryModel, category, sku));
    return data?.documents || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch display manual list data:', error);
    return [];
  }
};

const generateProductInfo = (product) => {
  const productInfoEl = document.createElement('div');
  productInfoEl.className = 'product-information';

  // eslint-disable-next-line no-underscore-dangle
  const productImagePath = product?.mediaGallery_image?._path;
  const imagePath = productImagePath ? toAbsoluteUrl(productImagePath) : '';
  const title = product?.title || product?.subtitle || '';
  const sku = product?.sku || '';

  if (imagePath) {
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'product-information-image';

    const image = document.createElement('img');
    image.alt = title || sku || 'Product image';
    image.src = imagePath;
    imageWrapper.appendChild(image);
    productInfoEl.appendChild(imageWrapper);
  }

  const textWrapper = document.createElement('div');
  textWrapper.className = 'product-information-text';

  if (sku) {
    const subtitle = document.createElement('p');
    subtitle.className = 'product-information-subtitle';
    subtitle.textContent = sku;
    textWrapper.appendChild(subtitle);
  }

  if (title) {
    const titleElement = document.createElement('p');
    titleElement.className = 'product-information-title';
    titleElement.textContent = title;
    textWrapper.appendChild(titleElement);
  }

  productInfoEl.appendChild(textWrapper);
  return productInfoEl;
};

const buildPaginationControls = (container, state, onPageChange) => {
  const { total, limit, offset } = state;
  if (total <= limit) {
    return;
  }
  const paginationEl = container.querySelector('.display-manual-list-pagination');
  if (!paginationEl) return;

  paginationEl.textContent = '';

  if (!total ?? !limit ?? (total <= limit)) {
    return;
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const createPaginationButton = (label, page, disabled = false, isActive = false) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('page-button');

    if (label === 'prev') {
      const icon = document.createElement('img');
      icon.src = `/content/dam/hisense/${country}/common-icons/left.svg`;
      icon.className = 'page-arrow is-prev normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = `/content/dam/hisense/${country}/common-icons/left-disabled.svg`;
      disabledIcon.className = 'page-arrow is-prev disabled';
      btn.setAttribute('aria-label', 'Previous page');
      btn.append(icon, disabledIcon);
    } else if (label === 'next') {
      const icon = document.createElement('img');
      icon.src = `/content/dam/hisense/${country}/common-icons/right.svg`;
      icon.className = 'page-arrow is-next normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = `/content/dam/hisense/${country}/common-icons/right-disabled.svg`;
      disabledIcon.className = 'page-arrow is-next disabled';
      btn.setAttribute('aria-label', 'Next page');
      btn.append(icon, disabledIcon);
    } else {
      btn.textContent = label;
    }

    if (isActive) btn.classList.add('is-active');
    if (disabled) {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => onPageChange(page));
    }
    return btn;
  };

  // Prev
  paginationEl.appendChild(
    createPaginationButton('prev', currentPage - 1, currentPage === 1),
  );

  const getVisiblePages = () => {
    const pages = [];

    if (totalPages <= 7) {
      // 总页数少，直接显示所有页
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      // 当前页在前部
      for (let i = 1; i <= 5; i += 1) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // 当前页在后部
      pages.push(1);
      pages.push('ellipsis');
      for (let i = totalPages - 4; i <= totalPages; i += 1) {
        pages.push(i);
      }
    } else {
      // 当前页在中部
      pages.push(1);
      pages.push('ellipsis');
      for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();
  visiblePages.forEach((page) => {
    if (page === 'ellipsis') {
      const ellipsis = document.createElement('div');
      ellipsis.className = 'pagination-ellipsis';
      const circle = document.createElement('div');
      circle.className = 'pagination-ellipsis-circle';
      ellipsis.append(circle, circle.cloneNode(), circle.cloneNode());
      paginationEl.appendChild(ellipsis);
    } else {
      paginationEl.appendChild(
        createPaginationButton(String(page), page, false, page === currentPage),
      );
    }
  });

  // Next
  paginationEl.appendChild(
    createPaginationButton('next', currentPage + 1, currentPage === totalPages),
  );
};

const generateDisplayManual = (commonInfo, manualInfo) => {
  const { documentIcon, pcDownloadButton, mobileDownloadIcon } = commonInfo;
  const pcDownloadButtonCopy = pcDownloadButton?.cloneNode(true);
  const mobileDownloadIconCopy = mobileDownloadIcon?.cloneNode(true);

  const { link } = manualInfo ?? {};
  const displayManualWrapperEl = document.createElement('div');
  displayManualWrapperEl.className = 'display-manual';
  const leftEl = document.createElement('div');
  leftEl.className = 'display-manual-left';
  if (documentIcon) {
    leftEl.appendChild(documentIcon.cloneNode(true));
  }
  if (link) {
    const noParamsUrl = link?.split('?')?.[0] ?? '';
    const fileName = noParamsUrl.substring(link.lastIndexOf('/') + 1);
    const title = fileName.substring(0, fileName.lastIndexOf('.'));
    const titleEl = document.createElement('div');
    titleEl.className = 'display-manual-title';
    titleEl.textContent = title;
    leftEl.appendChild(titleEl);
    displayManualWrapperEl.appendChild(leftEl);
    if (pcDownloadButtonCopy) {
      pcDownloadButtonCopy?.addEventListener('click', () => handleCommonDownloadClick(link));
      displayManualWrapperEl.appendChild(pcDownloadButtonCopy);
    }
    if (mobileDownloadIconCopy) {
      mobileDownloadIconCopy.addEventListener('click', () => handleCommonDownloadClick(link));
      displayManualWrapperEl.appendChild(mobileDownloadIconCopy);
    }
  }

  return displayManualWrapperEl;
};

export default async function decorate(block) {
  const [listTitleEl, resultsTitleEl, pageSizeEl, noResultEl, documentIconEl, pcDownloadEl, mobileDownloadIconEl, mobileLoadMoreEl] = [...block.children];
  const pageSize = (pageSizeEl?.textContent ?? 10) * 1;
  const noResultClone = noResultEl?.cloneNode?.(true);
  const documentIcon = documentIconEl?.querySelector('picture') || null;
  if (documentIcon) {
    documentIcon.className = 'document-icon';
  }
  const pcDownloadButton = pcDownloadEl?.children[0] || null;
  if (pcDownloadButton) {
    pcDownloadButton.classList.add('download-button', 'green-60');
  }
  const mobileDownloadIcon = mobileDownloadIconEl?.querySelector('picture') || null;
  if (mobileDownloadIcon) {
    mobileDownloadIcon.className = 'download-button-mobile';
  }
  const loadMoreText = mobileLoadMoreEl?.querySelector?.('p')?.textContent?.trim() || 'Load more';
  pageSizeEl?.remove();
  noResultEl?.remove();
  mobileLoadMoreEl?.remove();

  const { sku, category } = getSearchKeyword();

  const getNoResultContent = () => {
    const emptyEl = noResultClone?.children?.[0] ?? document.createElement('div');
    emptyEl.className = 'display-manual-list-empty-container';
    if (emptyEl) {
      const [emptyTitleEl, emptyTextEl] = emptyEl?.children ?? [];
      if (emptyTitleEl) emptyTitleEl.className = 'display-manual-list-empty-title';
      if (emptyTextEl) emptyTextEl.className = 'display-manual-list-empty-text';
    } else {
      emptyEl.textContent = 'No items found.';
      emptyEl.classList.add('display-manual-list-empty-title');
    }
    return emptyEl;
  };

  const productInfo = await getProductInfoBySKU(sku);
  if (!productInfo) {
    block.appendChild(getNoResultContent());
    listTitleEl.remove();
    resultsTitleEl.remove();
    documentIconEl?.remove();
    pcDownloadEl?.remove();
    mobileDownloadIconEl?.remove();
    return;
  }
  const productInfoEl = generateProductInfo(productInfo);
  block.appendChild(productInfoEl);
  const displayManualList = await getDisplayManualList(productInfo.factoryModel, category, sku);
  const bottomWrapperEl = document.createElement('div');
  bottomWrapperEl.classList.add('bottom-wrapper');
  listTitleEl.classList.add('list-title');
  resultsTitleEl.textContent = `${displayManualList?.length ?? 0} ${resultsTitleEl.textContent}`;
  resultsTitleEl.classList.add('results-title');
  bottomWrapperEl.append(listTitleEl, resultsTitleEl);
  if (displayManualList?.length) {
    const documentListEl = document.createElement('div');
    documentListEl.classList.add('document-list-wrapper');
    // PC分页器
    const paginationEl = document.createElement('div');
    paginationEl.className = 'display-manual-list-pagination';

    // Mobile按钮
    const mobilePaginationEl = document.createElement('div');
    mobilePaginationEl.className = 'display-manual-list-pagination-mobile';
    const mobileBtn = document.createElement('button');
    mobileBtn.type = 'button';
    mobileBtn.classList.add('page-button');
    mobileBtn.textContent = loadMoreText;
    mobilePaginationEl.appendChild(mobileBtn);

    const noPaginationEl = document.createElement('div');
    noPaginationEl.className = 'display-manual-list-no-pagination';

    documentListEl.appendChild(paginationEl);
    documentListEl.appendChild(mobilePaginationEl);

    const loadPage = (page, type = 'PC') => {
      const totalItems = displayManualList?.length ?? 0;

      const loadInfoList = documentListEl.querySelectorAll('.display-manual');
      if (loadInfoList?.length) {
        loadInfoList.forEach((info) => {
          info.remove();
        });
      }
      paginationEl.textContent = '';
      mobileBtn.style.display = 'none';

      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const safePage = Math.min(Math.max(page, 1), totalPages);
      const startIndex = (safePage - 1) * pageSize;
      const pageItems = type === 'PC' ? displayManualList.slice(startIndex, startIndex + pageSize) : displayManualList.slice(0, startIndex + pageSize);

      pageItems.forEach((displayManualInfo) => {
        const displayManualEl = generateDisplayManual({
          documentIcon, pcDownloadButton, mobileDownloadIcon,
        }, displayManualInfo);
        if (displayManualEl) {
          documentListEl.insertBefore(displayManualEl, paginationEl);
        }
      });

      const state = {
        total: totalItems,
        limit: pageSize,
        offset: startIndex,
      };

      // 创建PC端的分页器
      buildPaginationControls(documentListEl, state, (targetPage) => {
        if (targetPage < 1) return;
        const maxPage = Math.ceil(state.total / state.limit);
        if (targetPage > maxPage) return;
        loadPage(targetPage);
      });

      // 给移动端的 Load More 按钮添加事件
      if (page * pageSize < totalItems) {
        mobileBtn.style.display = 'block';
        mobileBtn.onclick = () => loadPage(safePage + 1, 'Mobile');
      } else {
        mobileBtn.style.display = 'none';
      }
    };
    loadPage(1);
    bottomWrapperEl.appendChild(documentListEl);
  } else {
    bottomWrapperEl.appendChild(getNoResultContent());
  }
  block.appendChild(bottomWrapperEl);
  block.classList.add('loaded');
  documentIconEl?.remove();
  pcDownloadEl?.remove();
  mobileDownloadIconEl?.remove();
  getDynamicHeaderHeight(block);
}
