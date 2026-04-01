import { readBlockConfig } from '../../scripts/aem.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

function buildPaginationControls(container, state, onPageChange, isEditMode) {
  const { total, limit, offset } = state;
  if (total <= limit) {
    return;
  }
  const paginationEl = container.querySelector('.info-list-pagination');
  if (!paginationEl) return;

  paginationEl.textContent = '';

  if (!total ?? !limit ?? (total <= limit && !isEditMode)) {
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
}

const generateCard = (info) => {
  info?.classList?.add?.('info-list-card');
  const [documentIconEl, infoEL, titleEl, textEl, subTextEl, locationEl] = info?.children ?? [];

  const wrapper = document.createElement('div');

  // card 左侧: icon
  documentIconEl?.classList?.add?.('card-image');

  if (infoEL) {
    infoEL.classList.add('card-info');
  }
  if (titleEl) {
    titleEl.classList.add('card-title');
  }
  if (textEl) {
    textEl.classList.add('card-text');
  }
  if (subTextEl) {
    subTextEl.classList.add('card-text');
  }

  if (locationEl) {
    locationEl.classList.add('card-location');
    locationEl.classList.add('meta-item');
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/location-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    locationEl.appendChild(iconImg);
  }
  wrapper.append(infoEL, titleEl, textEl, subTextEl, locationEl);
  wrapper.className = 'title-container';
  info.replaceChildren(documentIconEl, wrapper);
};

/**
 * Information List Module Block
 */
export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  const config = readBlockConfig(block);
  const pageSize = config['page-size'] * 1 ?? 10;
  const paginatedBtnText = config['paginated-btn-text'] ?? '';
  const infoListContainer = block;
  const [pageSizeEl, noResultEl, ...infoList] = [...block.children];
  const noResultCloneEl = noResultEl?.cloneNode?.(true);

  pageSizeEl?.remove?.();
  noResultEl?.remove?.();

  infoList?.forEach((info) => {
    generateCard(info);
  });

  // Author页面,不添加分页器
  if (isEditMode) {
    return;
  }

  // PC分页器
  const paginationEl = document.createElement('div');
  paginationEl.className = 'info-list-pagination';

  // Mobile按钮
  const mobilePaginationEl = document.createElement('div');
  mobilePaginationEl.className = 'info-list-pagination-mobile';
  const mobileBtn = document.createElement('button');
  mobileBtn.type = 'button';
  mobileBtn.classList.add('page-button');
  mobileBtn.textContent = 'Load more';
  mobilePaginationEl.appendChild(mobileBtn);

  const noPaginationEl = document.createElement('div');
  noPaginationEl.className = 'info-list-no-pagination';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.classList.add('page-button');
  btn.textContent = paginatedBtnText;
  noPaginationEl.appendChild(btn);
  if (isEditMode) {
    infoListContainer.appendChild(noPaginationEl);
  } else {
    infoListContainer.appendChild(paginationEl);
    infoListContainer.appendChild(mobilePaginationEl);
  }

  const loadPage = (page, type = 'PC') => {
    const totalItems = infoList?.length ?? 0;

    const loadInfoList = infoListContainer.querySelectorAll('.info-list-card');
    if (loadInfoList?.length) {
      loadInfoList.forEach((info) => {
        info.remove();
      });
    }
    paginationEl.textContent = '';
    mobileBtn.style.display = 'none';

    if (!totalItems) {
      const emptyEl = noResultCloneEl?.children?.[1] ?? document.createElement('div');
      emptyEl.className = 'info-list-empty-container';
      if (emptyEl) {
        const [emptyTitleEl, emptyTextEl] = emptyEl?.children ?? [];
        if (emptyTitleEl) emptyTitleEl.className = 'info-list-empty-title';
        if (emptyTextEl) emptyTextEl.className = 'info-list-empty-text';

        infoListContainer.appendChild(emptyEl);
      } else {
        emptyEl.textContent = 'No items found.';
        emptyEl.classList.add('info-list-empty-title');
      }
      return;
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const pageItems = type === 'PC' ? infoList.slice(startIndex, startIndex + pageSize) : infoList.slice(0, startIndex + pageSize);

    const pagination = infoListContainer.querySelector('.info-list-pagination');
    pageItems.forEach((info) => {
      infoListContainer.insertBefore(info, pagination);
    });

    const state = {
      total: totalItems,
      limit: pageSize,
      offset: startIndex,
    };

    // 创建PC端的分页器
    buildPaginationControls(infoListContainer, state, (targetPage) => {
      if (targetPage < 1) return;
      const maxPage = Math.ceil(state.total / state.limit);
      if (targetPage > maxPage) return;
      loadPage(targetPage);
    }, isEditMode);

    // 给移动端的 Load More 按钮添加事件
    if (page * pageSize < totalItems) {
      mobileBtn.style.display = 'block';
      mobileBtn.onclick = () => loadPage(safePage + 1, 'Mobile');
    } else {
      mobileBtn.style.display = 'none';
    }
  };

  loadPage(1);

  block.classList.add('loaded');
}
