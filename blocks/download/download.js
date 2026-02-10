import { readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_ITEM_IMAGE = 'https://picsum.photos/90/60';
const DEFAULT_DOWNLOAD_ICON = '/content/dam/hisense/us/common-icons/download.svg';
const DEFAULT_FOLDER_ICON = 'https://picsum.photos/80/80';

export default function decorate(block) {
  const config = readBlockConfig(block);
  const title = config.title || '';
  const subtitle = config.subtitle || '';
  const buttonText = config['button-to-download'] || '';

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
  const configKeys = ['title', 'subtitle', 'button-to-download'];
  const itemRows = allRows.filter((row) => {
    if (row.children.length === 2) {
      const firstCol = row.children[0].textContent.trim().toLowerCase();
      if (configKeys.includes(firstCol)) {
        return false;
      }
    }
    return row.children.length >= 6;
  });

  let totalSize = 0;

  itemRows.forEach((item) => {
    const cells = [...item.children];
    if (cells.length < 6) return;

    // Extract data from cells
    const imageCell = cells[0];
    const imageName = cells[1]?.textContent.trim() || '';
    const imagePx = cells[2]?.textContent.trim() || '';
    const imageDpi = cells[3]?.textContent.trim() || '';
    const imageSize = cells[4]?.textContent.trim() || '';
    const downloadIconCell = cells[5];

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

    const downloadIconImg = downloadIconCell?.querySelector('img');
    const downloadIcon = document.createElement('img');
    downloadIcon.src = downloadIconImg?.src || DEFAULT_DOWNLOAD_ICON;
    downloadIcon.alt = 'Download';
    downloadIconWrapper.appendChild(downloadIcon);

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
  folderIcon.src = DEFAULT_FOLDER_ICON;
  folderIcon.alt = 'Folder';
  downloadPanel.appendChild(folderIcon);

  // Download button
  if (buttonText) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = buttonText;
    downloadBtn.addEventListener('click', () => {
      // eslint-disable-next-line no-console
      console.log('Download all clicked');
    });
    downloadPanel.appendChild(downloadBtn);
  }

  // Total size
  if (totalSize > 0) {
    const totalSizeEl = document.createElement('div');
    totalSizeEl.className = 'total-size';
    totalSizeEl.textContent = `Total file size: ${totalSize.toFixed(0)} MB`;
    downloadPanel.appendChild(totalSizeEl);
  }

  contentWrapper.appendChild(downloadPanel);
  container.appendChild(contentWrapper);

  block.replaceChildren(container);
  block.classList.add('loaded');
}
