import { readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { handleCommonDownloadClick } from '../../utils/download.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';
const DEFAULT_ITEM_IMAGE = 'https://picsum.photos/90/60';
const DEFAULT_DOWNLOAD_ICON = `/content/dam/hisense/${country}/common-icons/download.svg`;
const DEFAULT_FOLDER_ICON = 'https://picsum.photos/80/80';

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

export default function decorate(block) {
  const config = readBlockConfig(block);
  const title = config.title || '';
  const subtitle = config.subtitle || '';
  const buttonText = config['button-to-download'] || '';
  const downloadAllLink = config['download-all-link'] || '';
  const downloadAllIcon = config['download-all-icon'] || '';
  const totalSizeText = config['total-size-text'] || 'Total file size';

  // Main container
  const container = document.createElement('div');
  container.className = 'download-meta-container';

  // Title group
  if (title || subtitle) {
    const titleGroup = document.createElement('div');
    titleGroup.className = 'title-group';

    if (title) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'title';
      titleDiv.textContent = title;
      titleGroup.appendChild(titleDiv);
    }

    if (subtitle) {
      const subtitleDiv = document.createElement('div');
      subtitleDiv.className = 'subtitle';
      subtitleDiv.textContent = subtitle;
      titleGroup.appendChild(subtitleDiv);
    }

    container.appendChild(titleGroup);
  }

  // Content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'content-wrapper';

  // Image list
  const imageList = document.createElement('div');
  imageList.className = 'image-list';

  const allRows = [...block.children];
  const configKeys = ['title', 'subtitle', 'button-to-download', 'download-all-link', 'download-all-icon', 'total-size-text'];
  const itemRows = allRows.filter((row) => {
    if (row.children.length === 2) {
      const firstCol = row.children[0].textContent.trim().toLowerCase();
      if (configKeys.includes(firstCol)) {
        return false;
      }
    }
    return row.children.length >= 7;
  });

  let totalSize = 0;

  itemRows.forEach((item) => {
    const cells = [...item.children];
    if (cells.length < 7) return;

    // Extract data from cells
    const imageCell = cells[0];
    const imageName = cells[1]?.textContent.trim() || '';
    const imagePx = cells[2]?.textContent.trim() || '';
    const imageDpi = cells[3]?.textContent.trim() || '';
    const imageSize = cells[4]?.textContent.trim() || '';
    const downloadIconCell = cells[5];
    const downloadLinkCell = cells[6];

    // Parse size for total calculation
    const sizeMatch = imageSize.match(/(\d+\.?\d*)\s*MB/i);
    if (sizeMatch) {
      totalSize += parseFloat(sizeMatch[1]);
    }

    // Image item
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    moveInstrumentation(item, imageItem);

    // Image
    const imageLink = imageCell?.querySelector('a');
    const imageImg = imageCell?.querySelector('img');
    const img = document.createElement('img');
    img.src = imageImg?.src || imageLink?.href || DEFAULT_ITEM_IMAGE;
    img.alt = imageImg?.alt || imageName || '';
    imageItem.appendChild(img);

    // Item info
    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';

    // Item name
    if (imageName) {
      const itemNameDiv = document.createElement('div');
      itemNameDiv.className = 'item-name';
      itemNameDiv.textContent = imageName;
      itemInfo.appendChild(itemNameDiv);
    }

    // Item meta
    const itemMeta = document.createElement('div');
    itemMeta.className = 'item-meta';

    // Add meta items with separators
    const metaItems = [imagePx, imageDpi, imageSize].filter(Boolean);
    metaItems.forEach((metaItem, index) => {
      const metaItemDiv = document.createElement('div');
      metaItemDiv.className = 'item-meta-item';
      metaItemDiv.textContent = metaItem;
      itemMeta.appendChild(metaItemDiv);

      if (index < metaItems.length - 1) {
        const line = document.createElement('div');
        line.className = 'line';
        itemMeta.appendChild(line);
      }
    });

    // Download icon
    if (metaItems.length > 0) {
      const line = document.createElement('div');
      line.className = 'line';
      itemMeta.appendChild(line);
    }

    const downloadIconWrapper = document.createElement('div');
    downloadIconWrapper.className = 'item-meta-item';

    // Get download link
    const downloadLinkEl = downloadLinkCell?.querySelector('a');
    const downloadImgEl = downloadLinkCell?.querySelector('img');
    const downloadLink = downloadLinkEl?.href || downloadImgEl?.src || downloadLinkCell?.textContent.trim() || '';
    if (downloadLink) {
      // Make download icon clickable
      const downloadLinkWrapper = document.createElement('a');
      downloadLinkWrapper.download = '';
      downloadLinkWrapper.className = 'download-link';
      downloadLinkWrapper.addEventListener('click', () => handleCommonDownloadClick(downloadLink));
      const downloadIconImg = downloadIconCell?.querySelector('img');
      const downloadIcon = document.createElement('img');
      downloadIcon.src = downloadIconImg?.src || DEFAULT_DOWNLOAD_ICON;
      downloadIcon.alt = 'Download';
      downloadLinkWrapper.appendChild(downloadIcon);
      downloadIconWrapper.appendChild(downloadLinkWrapper);
    } else {
      // No link, just show icon
      const downloadIconImg = downloadIconCell?.querySelector('img');
      const downloadIcon = document.createElement('img');
      downloadIcon.src = downloadIconImg?.src || DEFAULT_DOWNLOAD_ICON;
      downloadIcon.alt = 'Download';
      downloadIconWrapper.appendChild(downloadIcon);
    }

    itemMeta.appendChild(downloadIconWrapper);
    itemInfo.appendChild(itemMeta);
    imageItem.appendChild(itemInfo);
    imageList.appendChild(imageItem);
  });

  contentWrapper.appendChild(imageList);

  // Vertical line separator
  const verticalLine = document.createElement('div');
  verticalLine.className = 'line';
  contentWrapper.appendChild(verticalLine);

  // Download panel
  const downloadPanel = document.createElement('div');
  downloadPanel.className = 'download-panel';

  // Folder icon
  const folderIcon = document.createElement('img');
  folderIcon.className = 'folder-icon';
  folderIcon.src = downloadAllIcon || DEFAULT_FOLDER_ICON;
  folderIcon.alt = 'Folder';
  downloadPanel.appendChild(folderIcon);

  // Download button
  if (buttonText) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = buttonText;

    if (downloadAllLink) {
      const downloadBtnLink = document.createElement('div');
      downloadBtnLink.href = downloadAllLink;
      downloadBtnLink.download = '';
      downloadBtnLink.className = 'download-btn-link';
      downloadBtnLink.addEventListener('click', () => handleCommonDownloadClick(downloadAllLink));
      downloadBtnLink.appendChild(downloadBtn);
      downloadPanel.appendChild(downloadBtnLink);
    } else {
      downloadBtn.addEventListener('click', () => {
        // eslint-disable-next-line no-console
        console.log('Download all clicked');
      });
      downloadPanel.appendChild(downloadBtn);
    }
  }

  // Total size
  if (totalSize > 0) {
    const totalSizeEl = document.createElement('div');
    totalSizeEl.className = 'total-size';
    totalSizeEl.textContent = `${totalSizeText}: ${totalSize.toFixed(0)} MB`;
    downloadPanel.appendChild(totalSizeEl);
  }

  contentWrapper.appendChild(downloadPanel);
  container.appendChild(contentWrapper);

  block.replaceChildren(container);
  block.classList.add('loaded');

  // start popup
  let currentIndex = 0;
  const body = document.querySelector('body');
  const mediaCenterPopup = document.createElement('div');
  mediaCenterPopup.id = 'media-center-popup';
  const popupCloseImg = document.createElement('img');
  popupCloseImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
  popupCloseImg.className = 'close-icon';
  popupCloseImg.addEventListener('click', (e) => {
    e.stopPropagation();
    mediaCenterPopup.style.display = 'none';
  });

  const titleGroup = document.createElement('div');
  titleGroup.className = 'title-group';
  const titleEl = document.createElement('div');
  titleEl.className = 'media-title';
  titleEl.textContent = '海信电视';

  const dateEl = document.createElement('div');
  dateEl.className = 'media-date';
  dateEl.textContent = '2025年11月11日';
  titleGroup.append(titleEl, dateEl);

  const MOCK_DATA = Array.from(imageList.querySelectorAll('.image-item')).map((el) => {
    return {
      url: el.querySelector('img')?.src,
      type: 'image',
    };
  });
  console.log(MOCK_DATA);
  const mediaList = MOCK_DATA;

  const coreMediaEl = document.createElement('div');
  coreMediaEl.className = 'core-media';

  const galleryNumberGroup = document.createElement('div');
  galleryNumberGroup.className = 'gallery-number-group';

  const galleryNumberEl = document.createElement('span');
  galleryNumberEl.className = 'gallery-number';
  galleryNumberEl.textContent = `${currentIndex + 1 ?? 1}`;
  const galleryTotalEl = document.createElement('span');
  galleryTotalEl.className = 'gallery-total';
  galleryTotalEl.innerHTML = ` / ${mediaList.length}`
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
    li.className = `tab-item ${index === currentIndex ? 'current' : ''} ${item.type}`;
    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.url;
      li.appendChild(img);
    }
    tabs.append(li);
    if (index === currentIndex) {
      if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.url;
        coreMediaEl.append(img);
      }
    }
  });
  tabsContainer.append(tabs);
  galleryListGroup.append(leftBtn, tabsContainer, rightBtn);

  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group';
  const downloadBtn = document.createElement('div');
  downloadBtn.className = 'download-btn';
  downloadBtn.textContent = '下载照片';
  const downloadAllBtn = document.createElement('div');
  downloadAllBtn.className = 'download-all-btn';
  downloadAllBtn.textContent = '下载全部';
  btnGroup.append(downloadBtn, downloadAllBtn);

  mediaCenterPopup.append(popupCloseImg, titleGroup, coreMediaEl, galleryListGroup, btnGroup);
  body.append(mediaCenterPopup);
}
