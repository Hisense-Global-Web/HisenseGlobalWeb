import { readBlockConfig } from '../../scripts/aem.js';

// const DOWNLOAD_WHITE_ICON = '/content/dam/hisense/us/common-icons/download-white.svg';
// const DOWNLOAD_ICON = '/content/dam/hisense/us/common-icons/download.svg';
// const EMPTY_TITLE = 'No Recall Information';
// const EMPTY_TEXT = 'There is currently no product recall information available.';

// const MOCK_RECALL_INFORMATION_ITEM = {
//   title: 'Hisense French Door Refrigerator with Ice Maker (model number: HRF266N6CSE)',
//   announcedDate: '2026-02-09T06:55:15.717Z',
//   downloadUrl: 'http://www.ces.cn/file/upload/201407/25/14-57-43-23-182.jpg',
//   fileName: 'HisenseLogo.jpg',
// };

// function buildPaginationControls(container, state, onPageChange, isEditMode) {
//   const { total, limit, offset } = state;

//   const paginationEl = container.querySelector('.info-list-pagination');
//   if (!paginationEl) return;

//   paginationEl.textContent = '';

//   if (!total || !limit || (total <= limit && !isEditMode)) {
//     return;
//   }

//   const currentPage = Math.floor(offset / limit) + 1;
//   const totalPages = Math.ceil(total / limit);

//   const createPaginationButton = (label, page, disabled = false, isActive = false) => {
//     const btn = document.createElement('button');
//     btn.type = 'button';
//     btn.classList.add('page-button');

//     if (label === 'prev') {
//       const icon = document.createElement('img');
//       icon.src = '/content/dam/hisense/us/common-icons/left.svg';
//       icon.className = 'page-arrow is-prev normal';
//       const disabledIcon = document.createElement('img');
//       disabledIcon.src = '/content/dam/hisense/us/common-icons/left-disabled.svg';
//       disabledIcon.className = 'page-arrow is-prev disabled';
//       btn.setAttribute('aria-label', 'Previous page');
//       btn.append(icon, disabledIcon);
//     } else if (label === 'next') {
//       const icon = document.createElement('img');
//       icon.src = '/content/dam/hisense/us/common-icons/right.svg';
//       icon.className = 'page-arrow is-next normal';
//       const disabledIcon = document.createElement('img');
//       disabledIcon.src = '/content/dam/hisense/us/common-icons/right-disabled.svg';
//       disabledIcon.className = 'page-arrow is-next disabled';
//       btn.setAttribute('aria-label', 'Next page');
//       btn.append(icon, disabledIcon);
//     } else {
//       btn.textContent = label;
//     }

//     if (isActive) btn.classList.add('is-active');
//     if (disabled) {
//       btn.disabled = true;
//     } else {
//       btn.addEventListener('click', () => onPageChange(page));
//     }
//     return btn;
//   };

//   // Prev
//   paginationEl.appendChild(
//     createPaginationButton('prev', currentPage - 1, currentPage === 1),
//   );

//   // const maxButtons = 6;
//   // let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
//   // let end = start + maxButtons - 1;
//   // if (end > totalPages) {
//   //   end = totalPages;
//   //   start = Math.max(1, end - maxButtons + 1);
//   // }

//   // for (let page = start; page <= end; page += 1) {
//   //   paginationEl.appendChild(
//   //     createPaginationButton(String(page), page, false, page === currentPage),
//   //   );
//   // }

//   // for (let page = 1; page <= totalPages; page += 1) {
//   //   paginationEl.appendChild(
//   //     createPaginationButton(String(page), page, false, page === currentPage),
//   //   );
//   // }

//   const getVisiblePages = () => {
//     const pages = [];

//     if (totalPages <= 7) {
//       // 总页数少，直接显示所有页
//       for (let i = 1; i <= totalPages; i += 1) {
//         pages.push(i);
//       }
//     } else if (currentPage <= 4) {
//       // 当前页在前部
//       for (let i = 1; i <= 5; i += 1) {
//         pages.push(i);
//       }
//       pages.push('ellipsis');
//       pages.push(totalPages);
//     } else if (currentPage >= totalPages - 3) {
//       // 当前页在后部
//       pages.push(1);
//       pages.push('ellipsis');
//       for (let i = totalPages - 4; i <= totalPages; i += 1) {
//         pages.push(i);
//       }
//     } else {
//       // 当前页在中部
//       pages.push(1);
//       pages.push('ellipsis');
//       for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
//         pages.push(i);
//       }
//       pages.push('ellipsis');
//       pages.push(totalPages);
//     }
//     return pages;
//   };

//   const visiblePages = getVisiblePages();
//   visiblePages.forEach((page) => {
//     if (page === 'ellipsis') {
//       const ellipsis = document.createElement('div');
//       ellipsis.className = 'pagination-ellipsis';
//       const circle = document.createElement('div');
//       circle.className = 'pagination-ellipsis-circle';
//       ellipsis.append(circle, circle.cloneNode(), circle.cloneNode());
//       paginationEl.appendChild(ellipsis);
//     } else {
//       paginationEl.appendChild(
//         createPaginationButton(String(page), page, false, page === currentPage),
//       );
//     }
//   });

//   // Next
//   paginationEl.appendChild(
//     createPaginationButton('next', currentPage + 1, currentPage === totalPages),
//   );
// }

// const generateCard = (item) => {
//   // const [documentIcon, title, text, pcDownloadIcon, downloadBtnText, downloadBtnColor, downloadLink, mobileIcon, pdfUrl] = info.children;
//   const [documentIcon, title, text] = item.children;
//   console.log('Generating card for item:', item);
//   // const { title, announcedDate } = item;
//   const cardEl = document.createElement('div');
//   cardEl.className = 'info-list-card';

//   // card 左侧: icon + title + date 容器
//   const leftEl = document.createElement('div');
//   leftEl.className = 'card-left';

//   // card 左侧: icon
//   // const documentIcon = document.createElement('img');
//   // documentIcon.src = '/content/dam/hisense/us/common-icons/document.svg';
//   // documentIcon.alt = 'document';
//   documentIcon.classList.add('document-icon');
//   leftEl.appendChild(documentIcon);

//   // card 左侧: title + date 容器
//   const titleContainer = document.createElement('div');
//   titleContainer.classList.add('title-container');

//   // card 左侧: title
//   // const titleEl = document.createElement('div');
//   title.classList.add('card-title');
//   // title.textContent = title || '';
//   titleContainer.appendChild(title);

//   // card 左侧: date
//   // const dateEl = document.createElement('div');
//   text.classList.add('announced-date');
//   // text.textContent = text;
//   titleContainer.appendChild(text);
//   leftEl.appendChild(titleContainer);

//   // card 右侧: download button
//   // const downloadButton = generateDownloadButton(item);
//   cardEl.appendChild(leftEl);
//   // cardEl.appendChild(downloadButton);

//   // return cardEl;
//   return cardEl;
// };

/**
 * Recall Information List Block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  // const isEditMode = block.hasAttribute('data-aue-resource');
  // const pageSize = Number.parseInt(config['page-size'], 10) || 10;
  const shouldPaginated = true;
  const paginatedBtnText = config['paginated-btn-text'] || '';
  const infoListContainer = document.querySelector('.information-list-module');
  // const [pageSizeDiv, ...infoList] = [...block.children];
  // pageSizeDiv.remove();
  const cardGroupEl = document.createElement('div');
  cardGroupEl.className = 'info-list-card-group';
  // infoList.forEach((info) => {
  // console.log('Processing info item:', info);
  // info.style.dispay = 'none';
  // const [documentIcon, title, text, pcDownloadIcon, downloadBtnText, downloadBtnColor, downloadLink, mobileIcon, pdfUrl] = info.children;
  // cardGroupEl.appendChild(info);
  // const cardEL = generateCard(info);
  // cardGroupEl.appendChild(cardEL);
  // info.style.display = 'none';
  // });
  infoListContainer.appendChild(cardGroupEl);
  // Build static structure
  const container = document.createElement('div');
  container.className = 'info-list-container';

  // const cardGroupEl = document.createElement('div');
  // cardGroupEl.className = 'info-list-card-group';
  // container.appendChild(cardGroupEl);

  const paginationEl = document.createElement('div');
  paginationEl.className = 'info-list-pagination';

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
  if (shouldPaginated === 'false') {
    container.appendChild(noPaginationEl);
  } else {
    container.append(paginationEl, mobilePaginationEl);
  }

  // block.replaceChildren(container);

  // TODO: API获取数据，现在先用mock数据
  // const allItems = new Array(100).fill(0).map((_, i) => ({
  //   title: `${MOCK_RECALL_INFORMATION_ITEM.title} ${i + 1}`,
  //   announcedDate: MOCK_RECALL_INFORMATION_ITEM.announcedDate,
  //   downloadUrl: MOCK_RECALL_INFORMATION_ITEM.downloadUrl,
  //   fileName: `${MOCK_RECALL_INFORMATION_ITEM.title} ${i + 1}'.pdf'`,
  // }));
  // const allItems = infoList;
  // const allItems = [];

  // const generateDownloadButton = (item) => {
  //   const { downloadUrl, fileName } = item;
  //   const downloadContainer = document.createElement('div');
  //   downloadContainer.className = 'download-container';
  //   // PC端的Download按钮
  //   const downloadPC = document.createElement('div');
  //   downloadPC.className = 'download-button';
  //   const icon = document.createElement('img');
  //   icon.alt = 'download';
  //   icon.className = 'download-icon';
  //   icon.src = DOWNLOAD_WHITE_ICON;
  //   const downloadText = document.createElement('div');
  //   downloadText.textContent = 'Download';
  //   downloadPC.append(icon, downloadText);
  //   downloadContainer.appendChild(downloadPC);

  //   // Mobile端的Download按钮
  //   const downloadMobile = document.createElement('div');
  //   downloadMobile.className = 'download-button-mobile';
  //   const mobileIcon = document.createElement('img');
  //   mobileIcon.alt = 'download';
  //   mobileIcon.className = 'download-icon';
  //   mobileIcon.src = DOWNLOAD_ICON;
  //   downloadMobile.append(mobileIcon);
  //   downloadContainer.appendChild(downloadMobile);
  //   const handleDownload = () => {
  //     // TODO: 下载代码在这写
  //     /* eslint-disable-next-line no-console */
  //     console.log('Download file:', fileName, downloadUrl);
  //     //   const link = document.createElement('a');
  //     //   link.href = downloadUrl;
  //     //   if (fileName) {
  //     //     link.download = fileName; // 指定下载文件名
  //     //   }
  //     //   document.body.appendChild(link);
  //     //   link.click();
  //     //   document.body.removeChild(link);
  //   };
  //   if (downloadUrl) {
  //     downloadPC.addEventListener('click', handleDownload);
  //   } else {
  //     downloadPC.classList.add('disabled');
  //   }
  //   return downloadContainer;
  // };

  // const generateCard = (item) => {
  //   // const [documentIcon, title, text, pcDownloadIcon, downloadBtnText, downloadBtnColor, downloadLink, mobileIcon, pdfUrl] = info.children;
  //   const [documentIcon, title, text] = item.children;
  //   console.log('Generating card for item:', item);
  //   // const { title, announcedDate } = item;
  //   const cardEl = document.createElement('div');
  //   cardEl.className = 'info-list-card';

  //   // card 左侧: icon + title + date 容器
  //   const leftEl = document.createElement('div');
  //   leftEl.className = 'card-left';

  //   // card 左侧: icon
  //   // const documentIcon = document.createElement('img');
  //   // documentIcon.src = '/content/dam/hisense/us/common-icons/document.svg';
  //   // documentIcon.alt = 'document';
  //   documentIcon.classList.add('document-icon');
  //   leftEl.appendChild(documentIcon);

  //   // card 左侧: title + date 容器
  //   const titleContainer = document.createElement('div');
  //   titleContainer.classList.add('title-container');

  //   // card 左侧: title
  //   // const titleEl = document.createElement('div');
  //   title.classList.add('card-title');
  //   // title.textContent = title || '';
  //   titleContainer.appendChild(title);

  //   // card 左侧: date
  //   // const dateEl = document.createElement('div');
  //   text.classList.add('announced-date');
  //   // text.textContent = text;
  //   titleContainer.appendChild(text);
  //   leftEl.appendChild(titleContainer);

  //   // card 右侧: download button
  //   // const downloadButton = generateDownloadButton(item);
  //   cardEl.appendChild(leftEl);
  //   // cardEl.appendChild(downloadButton);

  //   // return cardEl;
  //   return cardEl;
  // };

  // const loadPage = async (page, type = 'PC') => {
  //   const totalItems = allItems.length;

  //   cardGroupEl.textContent = '';
  //   paginationEl.textContent = '';
  //   mobileBtn.style.display = 'none';

  //   if (!totalItems) {
  //     const emptyEl = document.createElement('div');
  //     emptyEl.className = 'info-list-empty-container';
  //     const emptyTitleEl = document.createElement('div');
  //     emptyTitleEl.className = 'info-list-empty-title';
  //     emptyTitleEl.textContent = EMPTY_TITLE;
  //     emptyEl.appendChild(emptyTitleEl);
  //     const emptyTextEl = document.createElement('div');
  //     emptyTextEl.className = 'info-list-empty-text';
  //     emptyTextEl.textContent = EMPTY_TEXT;
  //     emptyEl.appendChild(emptyTextEl);
  //     cardGroupEl.appendChild(emptyEl);
  //     return;
  //   }

  //   const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  //   const safePage = Math.min(Math.max(page, 1), totalPages);
  //   const startIndex = (safePage - 1) * pageSize;
  //   const pageItems = type === 'PC' ? allItems.slice(startIndex, startIndex + pageSize) : allItems.slice(0, startIndex + pageSize);

  //   pageItems.forEach((item) => {
  //     const card = generateCard(item);
  //     cardGroupEl.appendChild(card);
  //   });

  //   const state = {
  //     total: totalItems,
  //     limit: pageSize,
  //     offset: startIndex,
  //   };

  //   // 创建PC端的分页器
  //   buildPaginationControls(container, state, (targetPage) => {
  //     if (targetPage < 1) return;
  //     const maxPage = Math.ceil(state.total / state.limit);
  //     if (targetPage > maxPage) return;
  //     loadPage(targetPage);
  //   }, isEditMode);

  //   // 给移动端的 Load More 按钮添加事件
  //   if (page * pageSize < totalItems) {
  //     mobileBtn.style.display = 'block';
  //     mobileBtn.onclick = () => loadPage(safePage + 1, 'Mobile');
  //   } else {
  //     mobileBtn.style.display = 'none';
  //   }
  // };

  // await loadPage(1);

  block.classList.add('loaded');
}
