import { handleCommonDownloadClick } from '../../utils/download.js';

const MOCK_DATA = [{
  folder: 'French Door',
  data: [{
    pdfUrl: 'https://author-p174152-e1855821.adobeaemcloud.com/ui#/aem/assetdetails.html/content/dam/hisense-dev/download/French Door news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 2news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 3news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 4news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 5news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 6news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 7news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 8news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 9news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 10news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 11news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 12news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 13news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/French Door 14news.pdf',
  }],
},
{
  folder: 'Bottom Mount',
  data: [{
    pdfUrl: 'https://author-p174152-e1855821.adobeaemcloud.com/ui#/aem/assetdetails.html/content/dam/hisense-dev/download/Bottom Mount news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 1news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 3news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 4news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 5news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 6news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 7news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 8news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 9news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 10news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 11news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 12news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 13news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Bottom Mount 14news.pdf',
  }],
},
{
  folder: 'Compact',
  data: [{
    pdfUrl: 'https://author-p174152-e1855821.adobeaemcloud.com/ui#/aem/assetdetails.html/content/dam/hisense-dev/download/Compact news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news1news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news2news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news3news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news4news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news5news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news6news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news7news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news8news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news9news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news10news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news11news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news12news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/Compact news13news.pdf',
  }],
},
{
  folder: 'Freezers',
  data: [{
    pdfUrl: 'https://author-p174152-e1855821.adobeaemcloud.com/ui#/aem/assetdetails.html/content/dam/hisense-dev/download/Freezers news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  },
  {
    pdfUrl: '/content/dam/hisense-dev/download/news.pdf',
  }],
}];

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

function buildPaginationControls(container, state, onPageChange) {
  const { total, limit, offset } = state;
  if (total <= limit) {
    return;
  }
  const paginationEl = container.querySelector('.info-list-pagination');
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
}

const generateGuid = (commonInfo, guideInfo) => {
  const { documentIcon, pcDownloadButton, mobileDownloadIcon } = commonInfo;
  const pcDownloadButtonCopy = pcDownloadButton?.cloneNode(true);
  const mobileDownloadIconCopy = mobileDownloadIcon?.cloneNode(true);

  const { pdfUrl } = guideInfo ?? {};
  const guideWrapperEl = document.createElement('div');
  guideWrapperEl.className = 'tab-guide';
  const leftEl = document.createElement('div');
  leftEl.className = 'guide-left';
  if (documentIcon) {
    leftEl.appendChild(documentIcon.cloneNode(true));
  }
  if (pdfUrl) {
    const noParamsUrl = pdfUrl?.split('?')?.[0] ?? '';
    const fileName = noParamsUrl.substring(pdfUrl.lastIndexOf('/') + 1);
    const title = fileName.substring(0, fileName.lastIndexOf('.'));
    const titleEl = document.createElement('div');
    titleEl.className = 'guide-title';
    titleEl.textContent = title;
    leftEl.appendChild(titleEl);
    guideWrapperEl.appendChild(leftEl);
    pcDownloadButtonCopy.addEventListener('click', () => handleCommonDownloadClick(pdfUrl));
    mobileDownloadIconCopy.addEventListener('click', () => handleCommonDownloadClick(pdfUrl));
    guideWrapperEl.appendChild(pcDownloadButtonCopy);
    guideWrapperEl.appendChild(mobileDownloadIconCopy);
  }

  return guideWrapperEl;
};

export default function decorate(block) {
  let tabIndex = 0;
  const [pageSizeEl, noResultEl, documentIconEl, pcDownloadEl, mobileDownloadIconEl, mobileLoadMoreEl] = [...block.children];
  const pageSize = (pageSizeEl?.textContent ?? 10) * 1;
  const noResult = noResultEl?.textContent?.trim() || 'No items found.';
  console.log(noResult);
  const documentIcon = documentIconEl?.querySelector('picture') || null;
  if (documentIcon) {
    documentIcon.className = 'document-icon';
  }
  const pcDownloadButton = pcDownloadEl?.children[0] || null;
  if (pcDownloadButton) {
    pcDownloadButton.classList.add('download-button', 'green-60');
  }
  const mobileDownloadIcon = mobileDownloadIconEl?.querySelector('picture') || null;
  mobileDownloadIcon.className = 'download-button-mobile';
  const loadMoreText = mobileLoadMoreEl?.querySelector('p').textContent?.trim() || 'Load more';
  pageSizeEl?.remove();
  noResultEl?.remove();
  mobileLoadMoreEl?.remove();

  const tabsWrapperEl = document.createElement('div');
  tabsWrapperEl.className = 'guide-tabs-wrapper';
  const tabGuidListWrapperEl = document.createElement('div');
  if (MOCK_DATA?.length) {
    MOCK_DATA.forEach((item, index) => {
      const isCurrentTab = index === tabIndex;
      const { folder, data } = item;
      const tabEl = document.createElement('div');
      tabEl.className = 'tab';
      if (isCurrentTab) {
        tabEl.classList.add('active');
      }
      const tabTitleEl = document.createElement('div');
      tabTitleEl.className = 'tab-title';
      tabTitleEl.textContent = folder;
      tabEl.appendChild(tabTitleEl);

      const tabGuideListEl = document.createElement('div');
      tabGuideListEl.classList.add('tab-guide-list');
      if (!isCurrentTab) {
        tabGuideListEl.classList.add('display-none');
      }

      if (data?.length) {
        // PC分页器
        const paginationEl = document.createElement('div');
        paginationEl.className = 'info-list-pagination';

        // Mobile按钮
        const mobilePaginationEl = document.createElement('div');
        mobilePaginationEl.className = 'info-list-pagination-mobile';
        const mobileBtn = document.createElement('button');
        mobileBtn.type = 'button';
        mobileBtn.classList.add('page-button');
        mobileBtn.textContent = loadMoreText;
        mobilePaginationEl.appendChild(mobileBtn);

        const noPaginationEl = document.createElement('div');
        noPaginationEl.className = 'info-list-no-pagination';

        tabGuideListEl.appendChild(paginationEl);
        tabGuideListEl.appendChild(mobilePaginationEl);

        const loadPage = (page, type = 'PC') => {
          const totalItems = data?.length ?? 0;

          const loadInfoList = tabGuideListEl.querySelectorAll('.tab-guide');
          if (loadInfoList?.length) {
            loadInfoList.forEach((info) => {
              info.remove();
            });
          }
          paginationEl.textContent = '';
          mobileBtn.style.display = 'none';

          if (!totalItems) {
            const emptyEl = noResultEl?.children?.[1] ?? document.createElement('div');
            emptyEl.className = 'info-list-empty-container';
            if (emptyEl) {
              const [emptyTitleEl, emptyTextEl] = emptyEl?.children ?? [];
              if (emptyTitleEl) emptyTitleEl.className = 'info-list-empty-title';
              if (emptyTextEl) emptyTextEl.className = 'info-list-empty-text';

              tabGuideListEl.appendChild(emptyEl);
            } else {
              emptyEl.textContent = 'No items found.';
              emptyEl.classList.add('info-list-empty-title');
            }
            return;
          }

          const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
          const safePage = Math.min(Math.max(page, 1), totalPages);
          const startIndex = (safePage - 1) * pageSize;
          const pageItems = type === 'PC' ? data.slice(startIndex, startIndex + pageSize) : data.slice(0, startIndex + pageSize);

          pageItems.forEach((guide) => {
            const guideEl = generateGuid({
              documentIcon, pcDownloadButton, mobileDownloadIcon,
            }, guide);
            if (guideEl) {
              tabGuideListEl.insertBefore(guideEl, paginationEl);
            }
          });
          // tabGuidListWrapperEl.appendChild(tabGuideListEl);

          const state = {
            total: totalItems,
            limit: pageSize,
            offset: startIndex,
          };

          // 创建PC端的分页器
          buildPaginationControls(tabGuideListEl, state, (targetPage) => {
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
      } else {
        // TODO: 无数据时的处理，目前先隐藏整个列表，后续根据设计调整
      }
      tabsWrapperEl.appendChild(tabEl);
      tabGuidListWrapperEl.appendChild(tabGuideListEl);
    });
  }
  documentIconEl?.remove();
  pcDownloadEl?.remove();
  mobileDownloadIconEl?.remove();
  block.appendChild(tabsWrapperEl);
  block.appendChild(tabGuidListWrapperEl);

  // Tab切换事件
  const tabEls = tabsWrapperEl.querySelectorAll('.tab');
  tabEls.forEach((tabEl, index) => {
    tabEl.addEventListener('click', () => {
      if (index === tabIndex) return;
      const previousActiveTab = tabsWrapperEl.querySelector('.tab.active');
      if (previousActiveTab) {
        previousActiveTab.classList.remove('active');
        const previousContent = tabGuidListWrapperEl.querySelectorAll('.tab-guide-list')[tabIndex];
        if (previousContent) {
          previousContent.classList.add('display-none');
        }
      }
      tabEl.classList.add('active');
      const currentContent = tabGuidListWrapperEl.querySelectorAll('.tab-guide-list')[index];
      if (currentContent) {
        currentContent.classList.remove('display-none');
      }
      tabIndex = index;
    });
  });
}
