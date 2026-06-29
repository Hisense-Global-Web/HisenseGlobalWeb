import { getLocaleFromPath } from '../../scripts/locale-utils.js';
import { formatIsoToUtcStr } from '../../utils/carousel-common.js';
import { createDynamicMediaPicture, isVideoMediaUrl } from '../hero-banner/media-reference.js';
import { DYNAMIC_MEDIA_MANIFEST_M3U8, DYNAMIC_MEDIA_PLAY, SCREEN_POINT } from '../../utils/constants.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const { country, language } = getLocaleFromPath();

const generateChevronIcon = (diabled = false) => {
  const chevronIcon = document.createElement('div');
  const iconImg = document.createElement('img');
  if (diabled) {
    iconImg.src = `/content/dam/hisense/${country}/common-icons/bottom-disabled.svg`;
    chevronIcon.className = 'chevron-icon-disabled';
  } else {
    chevronIcon.className = 'chevron-icon';
    iconImg.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
  }
  iconImg.setAttribute('aria-hidden', 'true');
  iconImg.loading = 'lazy';
  chevronIcon.appendChild(iconImg);
  return chevronIcon;
};

const getSubOptions = (block, options, mainValue = null) => {
  let currentMainValue = mainValue;
  if (!currentMainValue) {
    currentMainValue = block.querySelector('.main-select .select-value')?.textContent ?? null;
  }
  return options.filter((option) => option.parent === currentMainValue)[0]?.options ?? [];
};

const setSelectOptionList = (selectOptionListWrapperEl, list, placeholder = null, callback = null) => {
  const oldOptionListWrapperEl = selectOptionListWrapperEl?.querySelector('.option-list-wrapper');
  if (oldOptionListWrapperEl) {
    oldOptionListWrapperEl.remove();
  }
  const optionListWrapperEl = document.createElement('div');
  optionListWrapperEl.className = 'option-list-wrapper';
  const optionListEl = document.createElement('div');
  optionListEl.className = 'option-list';
  const currentSelectdEl = selectOptionListWrapperEl.querySelector('.select-value');
  const currentSelectedValue = currentSelectdEl?.textContent ?? null;
  if (list?.length) {
    list.forEach((option) => {
      const optionEl = document.createElement('div');
      optionEl.textContent = option;
      optionEl.className = 'option';
      if (currentSelectedValue === option) {
        optionEl.classList.add('selected');
      }
      optionListEl.appendChild(optionEl);
    });
  }
  optionListWrapperEl.appendChild(optionListEl);

  [...optionListEl.children].forEach((optionEl) => {
    optionEl.addEventListener('click', () => {
      const selectedOptionList = optionListEl.querySelectorAll('.selected');
      selectedOptionList.forEach((selectedOption) => {
        selectedOption?.classList?.remove('selected');
      });
      const selectedValue = optionEl.textContent ?? null;
      const currentClickSelectdEl = selectOptionListWrapperEl.querySelector('.select-value');
      const currentClickSelectedValue = currentClickSelectdEl?.textContent ?? null;
      if (currentClickSelectedValue !== selectedValue) {
        if (selectedValue) {
          currentSelectdEl.textContent = selectedValue;
          optionEl.classList.add('selected');
        }
        if (selectedValue === placeholder) {
          currentClickSelectdEl.classList.add('select-placeholder');
        } else {
          currentClickSelectdEl.classList.remove('select-placeholder');
        }
        callback?.();
      }
    });
  });

  selectOptionListWrapperEl.appendChild(optionListWrapperEl);
};

const generateSelectEl = (label, placeholder = null) => {
  const titleSelectWrapperEl = document.createElement('div');
  titleSelectWrapperEl.className = 'title-select-wrapper';
  const titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = label;
  titleSelectWrapperEl.appendChild(titleEl);

  const selectOptionListWrapperEl = document.createElement('div');
  selectOptionListWrapperEl.className = 'select-option-list-wrapper';

  const selectWrapperEl = document.createElement('div');
  selectWrapperEl.classList.add('select-wrapper');
  const selectValueEl = document.createElement('div');
  selectValueEl.classList.add('select-value');
  if (placeholder) {
    selectValueEl.classList.add('select-placeholder');
  }
  selectValueEl.textContent = placeholder;
  selectWrapperEl.appendChild(selectValueEl);
  const chevronIcon = generateChevronIcon();
  const chevronDisabledIcon = generateChevronIcon(true);
  selectWrapperEl.append(chevronIcon, chevronDisabledIcon);
  selectOptionListWrapperEl.appendChild(selectWrapperEl);
  setSelectOptionList(selectOptionListWrapperEl, [placeholder], placeholder);
  titleSelectWrapperEl.appendChild(selectOptionListWrapperEl);
  selectOptionListWrapperEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.closest('.select-option-list-wrapper').classList.contains('disabled')) {
      return;
    }
    const selectWrapperList = document.querySelectorAll('.select-option-list-wrapper');
    if (selectWrapperList?.length) {
      const currentSelectParent = e.target.closest('.select-option-list-wrapper').cloneNode(true);
      selectWrapperList.forEach((selectEl) => {
        if (currentSelectParent.className !== selectEl.className) {
          selectEl.classList.remove('show');
        }
      });
    }
    selectOptionListWrapperEl.classList.toggle('show');
  });
  return titleSelectWrapperEl;
};

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

  const baseUrl = getBaseUrl();
  if (!baseUrl) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

const getMediaListEndpoint = () => `/bin/hisense/media/filter.json?country=${country}`;

const getCacheBustedUrl = (url) => {
  if (!url) return '';
  const cacheBuster = simpleHash(Math.floor(Date.now() / FIVE_MINUTES_MS));
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${cacheBuster}`;
};

const fetchJson = async (path) => {
  if (!path) return null;

  const url = getCacheBustedUrl(toAbsoluteUrl(path));
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

const sortCardList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.slice().sort((a, b) => {
    // 若 publishDate 字段为字符串类型的日期，直接比较新的在前
    if (a.publishDate && b.publishDate) {
      // 可按ISO格式直接比
      if (typeof a.publishDate === 'string' && typeof b.publishDate === 'string') {
        return b.publishDate.localeCompare(a.publishDate);
      }
      // 否则尝试转为数字
      return Number(b.publishDate) - Number(a.publishDate);
    }
    if (a.publishDate) return -1;
    if (b.publishDate) return 1;
    return 0;
  });
};

const getCardList = async () => {
  try {
    const data = await fetchJson(getMediaListEndpoint());
    if (data?.media?.length) {
      let mediaList = data.media;
      // add category and sub-category
      mediaList.forEach((item) => {
        const splits = item.categoryPath ? item.categoryPath.split('/') : [];
        item.category = splits[0] ?? null;
        item.subCategory = splits[1] ?? null;
        const isThumbnail = (Array.isArray(item.tags) && item.tags.includes('hisense:media/thumbnail')) || !splits[1];
        item.isThumbnail = isThumbnail;
        item.isVideo = isVideoMediaUrl(item.path);
      });

      // build list field for every thumbnail item
      mediaList = mediaList.map((item) => {
        if (item.isThumbnail) {
          // isThumbnail true时，给子级的list赋值
          const relatedList = mediaList.filter((i) => i.title === item.title && !i.isThumbnail);
          return { ...item, list: relatedList };
        }
        return item;
      });

      // Remove all non-thumbnail items from top level
      mediaList = mediaList.filter((item) => item.isThumbnail);
      return mediaList;
    }
    return [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch guides data:', error);
    return [];
  }
};

const getFilterCardList = (dataList, mainSelectValue, subSelectValue, placeholder2Text) => {
  if (!dataList?.length) {
    return [];
  }
  return dataList.filter((item) => {
    let mainMatch = true;
    let subMatch = true;
    if (mainSelectValue) {
      mainMatch = item.category === mainSelectValue;
    }
    if (subSelectValue && subSelectValue !== placeholder2Text) {
      subMatch = item.subCategory === subSelectValue;
    }
    return mainMatch && subMatch;
  });
};

const generateCard = (card) => {
  const {
    title, subCategory, path, dynamicMediaPath, publishDate,
  } = card ?? {};
  const mediaCardEl = document.createElement('div');
  mediaCardEl.className = 'card-wrapper';
  const thumbnailEl = createDynamicMediaPicture(dynamicMediaPath ?? path, title);
  thumbnailEl.className = 'thumbnail';
  mediaCardEl.appendChild(thumbnailEl);
  const bottomWrapperEl = document.createElement('div');
  bottomWrapperEl.className = 'bottom-wrapper';
  const textContentEl = document.createElement('div');
  textContentEl.className = 'text-content';
  if (subCategory) {
    const categoryEl = document.createElement('div');
    categoryEl.className = 'category';
    categoryEl.textContent = subCategory;
    textContentEl.appendChild(categoryEl);
  }
  const titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = title;
  textContentEl.appendChild(titleEl);
  bottomWrapperEl.appendChild(textContentEl);
  const dateWrapperEl = document.createElement('div');
  dateWrapperEl.className = 'date-wrapper';
  const dateIconEl = document.createElement('img');
  dateIconEl.className = 'date-icon';
  dateIconEl.src = `/content/dam/hisense/${country}/common-icons/time.svg`;
  dateIconEl.alt = 'Publish Date';
  const dateTextEl = document.createElement('div');
  dateTextEl.className = 'date-text';
  dateTextEl.textContent = publishDate?.length ? formatIsoToUtcStr(publishDate, language) : '';
  dateWrapperEl.append(dateIconEl, dateTextEl);
  bottomWrapperEl.appendChild(dateWrapperEl);
  mediaCardEl.appendChild(bottomWrapperEl);
  return mediaCardEl;
};

// render pagination
const buildPaginationControls = (container, state, onPageChange) => {
  const { total, limit, offset } = state;
  if (total <= limit) {
    return;
  }
  const paginationEl = container.querySelector('.card-list-pagination');
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
const loadPage = (block, options, dataList, type = 'PC') => {
  const {
    currentPage, pageSize, paginationEl, mobileBtn,
  } = options;
  const totalItems = dataList?.length ?? 0;

  const cardList = block.querySelectorAll('.card-wrapper');
  if (cardList?.length) {
    cardList.forEach((info) => {
      info.remove();
    });
  }
  paginationEl.textContent = '';
  mobileBtn.style.display = 'none';

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = type === 'PC' ? dataList.slice(startIndex, startIndex + pageSize) : dataList.slice(0, startIndex + pageSize);

  pageItems.forEach((card) => {
    const cardEl = generateCard(card);
    const cardWrapperEl = block.querySelector('.card-list-wrapper');
    if (cardEl) {
      if (card.list.length) {
        cardEl.style.cursor = 'pointer';
        cardEl.addEventListener('click', () => {
          // eslint-disable-next-line no-use-before-define
          buildGalleryPopup(card);
        });
      }
      cardWrapperEl.appendChild(cardEl);
    }
  });

  const state = {
    total: totalItems,
    limit: pageSize,
    offset: startIndex,
  };

  // 创建PC端的分页器
  buildPaginationControls(block, state, (targetPage) => {
    if (targetPage < 1) return;
    const maxPage = Math.ceil(state.total / state.limit);
    if (targetPage > maxPage) return;
    loadPage(block, {
      currentPage: targetPage, pageSize, paginationEl, mobileBtn,
    }, dataList);
  });

  // 给移动端的 Load More 按钮添加事件
  if (currentPage * pageSize < totalItems) {
    mobileBtn.style.display = 'block';
    mobileBtn.onclick = () => loadPage(block, {
      currentPage: safePage + 1, pageSize, paginationEl, mobileBtn,
    }, dataList, 'Mobile');
  } else {
    mobileBtn.style.display = 'none';
  }
};

const handleSearchClick = (block, options, dataList) => {
  const { placeholder2Text, pageSize = 9 } = options;
  const mainSelectValue = block.querySelector('.main-select .select-value')?.textContent ?? null;
  const subSelectValue = block.querySelector('.sub-select .select-value')?.textContent ?? null;
  const filteredData = getFilterCardList(dataList, mainSelectValue, subSelectValue, placeholder2Text);
  const cardList = block.querySelectorAll('.card-wrapper');
  if (cardList?.length) {
    cardList.forEach((info) => {
      info.remove();
    });
  }
  const paginationEl = block.querySelector('.card-list-pagination');
  const mobileBtn = block.querySelector('.card-list-pagination-mobile .page-button');
  loadPage(block, {
    currentPage: 1, pageSize, paginationEl, mobileBtn,
  }, filteredData);
};

const getSelectOptions = (list) => {
  if (!Array.isArray(list) || !list.length) return [];
  const categoryMap = {};
  list.forEach((item) => {
    const { category, subCategory } = item;
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    if (
      subCategory && !categoryMap[category].includes(subCategory)
    ) {
      categoryMap[category].push(subCategory);
    }
  });

  const result = Object.keys(categoryMap).map((item) => ({
    parent: item,
    options: categoryMap[item],
  }));

  return result;
};

function createScrollButton(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `scroll-btn scroll-${direction}`;
  button.setAttribute('aria-label', direction === 'left' ? 'Scroll left' : 'Scroll right');
  button.disabled = direction === 'left';
  // 创建图片元素
  const img = document.createElement('img');
  img.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left-g.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right-g.svg`;
  img.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  img.className = 'disabled-icon';
  button.appendChild(img);
  // 创建图片元素
  const imgClick = document.createElement('img');
  imgClick.src = direction === 'left' ? `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-left.svg` : `/content/dam/hisense/${country}/common-icons/icon-carousel/nav-right.svg`;
  imgClick.alt = direction === 'left' ? 'Scroll left' : 'Scroll right';
  imgClick.className = 'click-icon';
  button.appendChild(imgClick);
  return button;
}

function updateButtons(tabsList, leftBtn, rightBtn) {
  leftBtn.disabled = tabsList.scrollLeft <= 0;
  rightBtn.disabled = tabsList.scrollLeft + tabsList.clientWidth + 10 >= tabsList.scrollWidth;
}

function createImg(url) {
  const img = createDynamicMediaPicture(url);
  return img;
}

function createVideo(videoUrl) {
  const video = document.createElement('video');
  video.classList.add('autoplay-video');
  video.setAttribute('data-video-autoplay', 'true');
  video.controls = true;
  video.width = 600;
  video.preload = 'auto';
  video.playsInline = true;
  video.muted = true; // iPhone 要求静音才能自动播放
  const source = document.createElement('source');
  source.src = videoUrl.replace(`/${DYNAMIC_MEDIA_PLAY}`, `/${DYNAMIC_MEDIA_MANIFEST_M3U8}`);
  source.type = 'video/mp4';
  video.innerHTML = '';
  video.appendChild(source);
  video.addEventListener('canplay', () => {
    video.play().catch(() => { });
  });
  return video;
}

function attachScrollHandlers(tabsList, leftBtn, rightBtn) {
  // 左箭头
  leftBtn.addEventListener('click', () => {
    const isMobile = window.innerWidth < SCREEN_POINT;
    const SCROLL_STEP = isMobile ? ((54 * Math.min(window.innerWidth, 390)) / 390) : ((54 * Math.min(window.innerWidth, 1440)) / 1440);
    tabsList.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' });
    setTimeout(() => {
      updateButtons(tabsList, leftBtn, rightBtn);
    }, 300);
  });

  // 右箭头
  rightBtn.addEventListener('click', () => {
    const isMobile = window.innerWidth < SCREEN_POINT;
    const SCROLL_STEP = isMobile ? ((54 * Math.min(window.innerWidth, 390)) / 390) : ((54 * Math.min(window.innerWidth, 1440)) / 1440);
    tabsList.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' });
    setTimeout(() => {
      updateButtons(tabsList, leftBtn, rightBtn);
    }, 300);
  });

  tabsList.addEventListener('scroll', () => {
    updateButtons(tabsList, leftBtn, rightBtn);
  });

  // ---------- 核心修复：resize 自动对齐校正 ----------
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < SCREEN_POINT;
    const firstItem = tabsList.querySelector('.product-filter-item');
    if (firstItem) {
      if (isMobile) {
        // 手机端item宽度为100vw
        const itemWidth = window.innerWidth;
        const closestScroll = Math.round(tabsList.scrollLeft / itemWidth) * itemWidth;
        tabsList.scrollTo({ left: closestScroll, behavior: 'instant' });
      } else {
        // 桌面端原有逻辑
        const itemWidth = firstItem.offsetWidth + 16; // 包含间距
        const closestScroll = Math.round(tabsList.scrollLeft / itemWidth) * itemWidth;
        tabsList.scrollTo({ left: closestScroll, behavior: 'instant' });
      }
    }

    updateButtons(tabsList, leftBtn, rightBtn);
  });

  updateButtons(tabsList, leftBtn, rightBtn);
}

const buildGalleryPopup = (cardData) => {
  // start popup
  let currentIndex = 0;
  const mediaCenterPopup = document.querySelector('#media-center-popup');
  mediaCenterPopup.innerHTML = '';
  const popupCloseImg = document.createElement('img');
  popupCloseImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
  popupCloseImg.className = 'close-icon';
  popupCloseImg.addEventListener('click', (e) => {
    e.stopPropagation();
    mediaCenterPopup.style.display = 'none';
    document.querySelector('#gallery-mask').style.display = 'none';
  });

  const titleGroup = document.createElement('div');
  titleGroup.className = 'title-group';
  const titleEl = document.createElement('div');
  titleEl.className = 'media-title';
  titleEl.textContent = cardData.title;

  const dateEl = document.createElement('div');
  dateEl.className = 'media-date';
  dateEl.textContent = formatIsoToUtcStr(cardData.publishDate, language);
  titleGroup.append(titleEl, dateEl);

  const mediaList = cardData.list;

  const coreMediaEl = document.createElement('div');
  coreMediaEl.className = 'core-media';

  const galleryNumberGroup = document.createElement('div');
  galleryNumberGroup.className = 'gallery-number-group';

  const galleryNumberEl = document.createElement('span');
  galleryNumberEl.className = 'gallery-number';
  galleryNumberEl.textContent = `${currentIndex + 1 ?? 1}`;
  const galleryTotalEl = document.createElement('span');
  galleryTotalEl.className = 'gallery-total';
  galleryTotalEl.innerHTML = ` / ${mediaList.length}`;
  galleryNumberGroup.append(galleryNumberEl, galleryTotalEl);
  coreMediaEl.append(galleryNumberGroup);

  const galleryListGroup = document.createElement('div');
  galleryListGroup.className = 'gallery-list-group';
  const leftBtn = createScrollButton('left');
  const rightBtn = createScrollButton('right');
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';

  const tabs = document.createElement('ul');
  tabs.className = 'gallery-tabs';

  mediaList.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `tab-item ${index === currentIndex ? 'current' : ''} ${item.isVideo ? 'video' : 'image'}`;
    if (item.isVideo) {
      const video = document.createElement('video');
      video.controls = false;
      video.width = 44;
      video.preload = 'auto';
      video.playsInline = false;
      video.muted = true; // iPhone 要求静音才能自动播放
      const source = document.createElement('source');
      source.src = item.dynamicMediaPath?.replace(`/${DYNAMIC_MEDIA_PLAY}`, `/${DYNAMIC_MEDIA_MANIFEST_M3U8}`) ?? item.path;
      source.type = 'video/mp4';
      video.innerHTML = '';
      video.appendChild(source);
      li.appendChild(video);
    } else {
      li.appendChild(createImg(item.dynamicMediaPath ?? item.path));
    }
    li.addEventListener('click', (e) => {
      currentIndex = index;
      e.currentTarget.parentElement.querySelector('.current').classList.remove('current');
      e.currentTarget.classList.add('current');
      const popup = e.currentTarget.closest('#media-center-popup');
      const coreMedia = popup.querySelector('.core-media');
      const dowloadbtn = popup.querySelector('.btn-group .download-btn');
      Array.from(coreMedia.children).forEach((child) => {
        if (!child.matches('.gallery-number-group')) {
          coreMedia.removeChild(child);
        }
      });
      if (item.isVideo) {
        coreMedia.appendChild(createVideo(item.dynamicMediaPath ?? item.path));
        dowloadbtn.textContent = '下载视频';
      } else {
        const link = e.currentTarget.querySelector('img').src;
        coreMedia.appendChild(createImg(link));
        dowloadbtn.textContent = '下载照片';
      }
      coreMedia.querySelector('.gallery-number-group .gallery-number').textContent = `${currentIndex + 1 ?? 1}`;
    });
    tabs.append(li);
    if (index === currentIndex) {
      if (item.isVideo) {
        coreMediaEl.appendChild(createVideo(item.dynamicMediaPath ?? item.path));
      } else {
        coreMediaEl.appendChild(createImg(item.dynamicMediaPath ?? item.path));
      }
    }
  });
  attachScrollHandlers(tabs, leftBtn, rightBtn);

  if (tabs?.childElementCount > 9) {
    rightBtn.removeAttribute('disabled');
  }
  tabsContainer.append(tabs);
  galleryListGroup.append(leftBtn, tabsContainer, rightBtn);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group';
  const downloadBtn = document.createElement('div');
  downloadBtn.className = 'download-btn';
  downloadBtn.textContent = mediaList[currentIndex].isVideo ? '下载视频' : '下载照片';
  downloadBtn.addEventListener('click', () => {
    const { id, path } = mediaList[currentIndex];
    const link = document.createElement('a');
    link.href = getCacheBustedUrl(toAbsoluteUrl(`/bin/hisense/media/download?id=${id}&path=${path}`));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  const downloadAllBtn = document.createElement('div');
  downloadAllBtn.className = 'download-all-btn';
  downloadAllBtn.textContent = '下载全部';
  downloadAllBtn.addEventListener('click', () => {
    const { id, path, title } = cardData;
    const link = document.createElement('a');
    link.href = getCacheBustedUrl(toAbsoluteUrl(`/bin/hisense/media/download?id=${id}&path=${path}&isDownloadAll=true&title=${title}`));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  btnGroup.append(downloadBtn, downloadAllBtn);

  mediaCenterPopup.append(popupCloseImg, titleGroup, coreMediaEl, galleryListGroup, btnGroup);
  mediaCenterPopup.style.display = 'flex';
  document.querySelector('#gallery-mask').style.display = 'block';
};

export default async function decorate(block) {
  const cardList = await getCardList();
  const categoryGroupOptions = getSelectOptions(cardList);
  const mainOptions = categoryGroupOptions.map((item) => item.parent) ?? [];
  const [label1El, label2El, placeholder2El, buttonTextEl, loadMoreEl, pageSizeEL] = [...block.children] ?? [];
  const loadMoreText = loadMoreEl?.textContent ?? 'Load More';
  const pageSize = Number(pageSizeEL?.textContent) || 9;
  const searchCardWrapper = document.createElement('div');
  searchCardWrapper.className = 'search-card-wrapper';
  const searchCardInner = document.createElement('div');
  searchCardInner.className = 'search-card-inner';
  const mainSelectWrapperEl = generateSelectEl(label1El?.textContent ?? '');
  const mainOptionListWrapperEl = mainSelectWrapperEl.querySelector('.select-option-list-wrapper');
  mainOptionListWrapperEl.classList.add('main-select');
  const placeholder2Text = placeholder2El?.textContent ?? '';
  const subSelectWrapperEl = generateSelectEl(label2El?.textContent ?? '', placeholder2Text);
  const subOptionListWrapperEl = subSelectWrapperEl.querySelector('.select-option-list-wrapper');
  subOptionListWrapperEl.classList.add('sub-select');
  const subOptions = getSubOptions(block, categoryGroupOptions, mainOptions[0]);
  // 初始化dropdown list
  mainOptionListWrapperEl.querySelector('.select-value').textContent = mainOptions[0] ?? '';
  setSelectOptionList(mainOptionListWrapperEl, mainOptions, null, () => {
    const currentSubOptions = getSubOptions(block, categoryGroupOptions);
    setSelectOptionList(subOptionListWrapperEl, [placeholder2Text, ...currentSubOptions], placeholder2Text);
    if (currentSubOptions?.length) {
      block.querySelector('.sub-select')?.classList.remove('disabled');
    } else {
      block.querySelector('.sub-select')?.classList.add('disabled');
    }
    const subValue = block.querySelector('.sub-select .select-value');
    if (subValue) {
      subValue.classList.add('select-placeholder');
      subValue.textContent = placeholder2Text;
    }
  });
  setSelectOptionList(subOptionListWrapperEl, [placeholder2Text, ...subOptions], placeholder2Text);
  if (!subOptions?.length) {
    subOptionListWrapperEl?.classList.add('disabled');
  }
  searchCardInner.appendChild(mainSelectWrapperEl);
  searchCardInner.appendChild(subSelectWrapperEl);
  const sortedCardList = sortCardList(cardList);
  const buttonEl = document.createElement('button');
  buttonEl.className = 'search-button';
  buttonEl.textContent = buttonTextEl?.textContent ?? '';
  buttonEl.addEventListener('click', () => {
    handleSearchClick(block, { placeholder2Text, pageSize }, sortedCardList);
  });
  searchCardInner.appendChild(buttonEl);
  searchCardWrapper.appendChild(searchCardInner);
  block.textContent = '';
  block.appendChild(searchCardWrapper);

  // render media list
  const bottomWrapperEl = document.createElement('div');
  bottomWrapperEl.className = 'bottom-wrapper';
  const cardListWrapperEl = document.createElement('div');
  cardListWrapperEl.className = 'card-list-wrapper';
  const filterDataList = getFilterCardList(sortedCardList, mainOptions[0], null, placeholder2Text);
  const body = document.querySelector('body');
  const mediaCenterPopup = document.createElement('div');
  mediaCenterPopup.id = 'media-center-popup';
  const mask = document.createElement('div');
  mask.id = 'gallery-mask';
  body.append(mediaCenterPopup, mask);

  filterDataList.forEach((card) => {
    const cardEl = generateCard(card);
    console.log(cardEl);
    cardEl.addEventListener('click', (e) => {
      console.log(e);
      buildGalleryPopup(card);
    });
    cardListWrapperEl.appendChild(cardEl);
  });

  // PC分页器
  const paginationEl = document.createElement('div');
  paginationEl.className = 'card-list-pagination';

  // Mobile按钮
  const mobilePaginationEl = document.createElement('div');
  mobilePaginationEl.className = 'card-list-pagination-mobile';
  const mobileBtn = document.createElement('button');
  mobileBtn.type = 'button';
  mobileBtn.classList.add('page-button');
  mobileBtn.textContent = loadMoreText;
  mobilePaginationEl.appendChild(mobileBtn);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.classList.add('page-button');
  btn.textContent = loadMoreText;
  bottomWrapperEl.appendChild(cardListWrapperEl);
  const paginationWrapperEl = document.createElement('div');
  paginationWrapperEl.className = 'pagination-wrapper';
  paginationWrapperEl.append(paginationEl, mobilePaginationEl);
  bottomWrapperEl.appendChild(paginationWrapperEl);
  block.appendChild(bottomWrapperEl);
  loadPage(block, {
    currentPage: 1, pageSize, paginationEl, mobileBtn,
  }, filterDataList);
  block.classList.add('loaded');

  // 点击其他地方时隐藏OptionList
  window.document.addEventListener('click', (e) => {
    const selectListEl = document.querySelectorAll('.select-option-list-wrapper.show');
    const { target } = e;
    const targetWrapper = target.closest('.select-option-list-wrapper');
    if (targetWrapper) {
      if (targetWrapper.classList.contains('show')) {
        targetWrapper.classList.remove('show');
      } else {
        const allWrappers = document.querySelectorAll('.select-option-list-wrapper');
        // 点击当前select时，关闭其他select的option list，并切换当前select的option list显示状态
        allWrappers.forEach((wrapper) => {
          if (wrapper === targetWrapper) {
            wrapper.classList.toggle('show');
          } else if (wrapper.classList.contains('show')) {
            wrapper.classList.remove('show');
          }
        });
      }
    } else if (selectListEl?.length) {
      selectListEl.forEach((selectEl) => {
        selectEl.classList.remove('show');
      });
    }
  });
}
