import { readBlockConfig } from '../../scripts/aem.js';

const EModuleType = Object.freeze({
  download: 'download',
  navigate: 'navigate',
});

function buildPaginationControls(container, state, onPageChange, isEditMode) {
  const { total, limit, offset } = state;
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
      icon.src = '/content/dam/hisense/us/common-icons/left.svg';
      icon.className = 'page-arrow is-prev normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = '/content/dam/hisense/us/common-icons/left-disabled.svg';
      disabledIcon.className = 'page-arrow is-prev disabled';
      btn.setAttribute('aria-label', 'Previous page');
      btn.append(icon, disabledIcon);
    } else if (label === 'next') {
      const icon = document.createElement('img');
      icon.src = '/content/dam/hisense/us/common-icons/right.svg';
      icon.className = 'page-arrow is-next normal';
      const disabledIcon = document.createElement('img');
      disabledIcon.src = '/content/dam/hisense/us/common-icons/right-disabled.svg';
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

const generateRightButton = (moduleType, info) => {
  const isDownload = moduleType === EModuleType.download;
  const buttonContainerEl = info?.children?.[2] ?? document.createElement('div');
  const pdfUrlEl = info?.children?.[3] ?? document.createElement('div');
  buttonContainerEl.classList.add('operate-button-container');
  let pcIconEl; let btnTextEl; let btnColorEl; let btnLinkEl; let mobileIconEl;
  // 需要判断 PCIcon不存在的情况
  if (buttonContainerEl?.children?.[0]?.querySelector?.('img')) {
    pcIconEl = buttonContainerEl?.children?.[0];
    btnTextEl = buttonContainerEl?.children?.[1];
    btnColorEl = buttonContainerEl?.children?.[2];
    btnLinkEl = buttonContainerEl?.children?.[3];
    mobileIconEl = buttonContainerEl?.children?.[4];
  } else {
    btnTextEl = buttonContainerEl?.children?.[0];
    btnColorEl = buttonContainerEl?.children?.[1];
    btnLinkEl = buttonContainerEl?.children?.[2];
    mobileIconEl = buttonContainerEl?.children?.[3];
  }
  // const [pcIconEl, btnTextEl, btnColorEl, btnLinkEl, mobileIconEl] = buttonContainerEl.children ?? [];

  const btnBgColor = btnColorEl?.textContent?.trim();
  btnColorEl?.remove();
  const btnLink = btnLinkEl?.textContent?.trim?.();
  btnLinkEl?.remove();
  let pdfUrl = null;
  if (pdfUrlEl) {
    if (pdfUrlEl.querySelector('a')) {
      pdfUrl = pdfUrlEl.querySelector('a').href;
    } else if (pdfUrlEl.querySelector('img')) {
      pdfUrl = pdfUrlEl.querySelector('img').src;
    }
  }
  pdfUrlEl.remove();

  // PC端的按钮
  const buttonPCContainer = document.createElement('div');
  buttonPCContainer.className = 'download-button';
  if (btnBgColor) {
    buttonPCContainer.classList.add(btnBgColor);
  }
  if (pcIconEl) {
    buttonPCContainer.appendChild(pcIconEl);
  }
  if (btnTextEl) {
    buttonPCContainer.appendChild(btnTextEl);
  }
  buttonContainerEl.appendChild(buttonPCContainer);

  // Mobile端的Download按钮
  if (mobileIconEl) {
    mobileIconEl.className = 'download-button-mobile';
  }

  const btnOperateUrl = isDownload ? pdfUrl : btnLink;
  const handleDownload = () => {
    if (isDownload) {
      const link = document.createElement('a');
      link.href = btnOperateUrl;
      link.download = btnOperateUrl.substring(btnOperateUrl.lastIndexOf('/') + 1);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.location.href = btnOperateUrl;
    }
  };

  if (btnOperateUrl) {
    buttonContainerEl.classList.remove('disabled');
    buttonContainerEl.addEventListener('click', handleDownload);
  } else {
    buttonContainerEl.classList.add('disabled');
  }
};

// const generateAuthorRightButton = (info) => {
//   const buttonContainerEl = info?.children?.[2] ?? document.createElement('div');
//   const pdfUrlEl = info?.children?.[3] ?? document.createElement('div');
//   buttonContainerEl.classList.add('download-button');
//   let btnColorEl; let btnLinkEl; let mobileIconEl;
//   // 需要判断 PCIcon不存在的情况
//   if (buttonContainerEl?.children?.[0]?.querySelector?.('img')) {
//     btnColorEl = buttonContainerEl?.children?.[2];
//     btnLinkEl = buttonContainerEl?.children?.[3];
//     mobileIconEl = buttonContainerEl?.children?.[4];
//   } else {
//     btnColorEl = buttonContainerEl?.children?.[1];
//     btnLinkEl = buttonContainerEl?.children?.[2];
//     mobileIconEl = buttonContainerEl?.children?.[3];
//   }

//   const btnBgColor = btnColorEl?.textContent?.trim();
//   buttonContainerEl.classList.add(btnBgColor);
//   btnColorEl?.remove();
//   btnLinkEl?.remove();
//   pdfUrlEl?.remove();
//   mobileIconEl?.remove();
// };

const generateCard = (moduleType, isEditMode, info) => {
  info?.classList?.add?.('info-list-card');
  const [documentIconEl, titleContainerEl] = info?.children ?? [];

  // card 左侧: icon
  documentIconEl?.classList?.add?.('document-icon');

  titleContainerEl?.classList?.add?.('title-container');
  const [titleEl, textEl] = titleContainerEl?.children ?? [];
  if (titleEl) {
    titleEl.classList.add('card-title');
  }
  if (textEl) {
    textEl.classList.add('card-text');
  }

  // card 右侧: download button
  generateRightButton(moduleType, info);
  // if (isEditMode) {
  //   generateAuthorRightButton(info);
  // } else {
  //   generateRightButton(moduleType, info);
  // }
};

/**
 * Recall Information List Block
 */
export default async function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  const config = readBlockConfig(block);
  const moduleType = config['module-type'] ?? '';
  const pageSize = config['page-size'] * 1 ?? 10;
  const paginatedBtnText = config['paginated-btn-text'] ?? '';
  const infoListContainer = document.querySelector('.information-list-module');
  const [moduleTypeEl, pageSizeEl, noResultEl, ...infoList] = [...block.children];
  const noResultCloneEl = noResultEl?.cloneNode?.(true);
  moduleTypeEl?.remove();
  pageSizeEl?.remove();
  noResultEl?.remove();

  // infoListContainer.classList.add('info-list-card-group');
  infoList?.forEach((info) => {
    generateCard(moduleType, isEditMode, info);
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

  const loadPage = async (page, type = 'PC') => {
    const totalItems = infoList?.length ?? 0;

    const loadInfoList = document.querySelectorAll('.info-list-card');
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

    const pagination = document.querySelector('.info-list-pagination');
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

  await loadPage(1);

  block.classList.add('loaded');
}
