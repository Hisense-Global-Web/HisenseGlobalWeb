import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_ITEM_IMAGE = 'https://picsum.photos/90/60';
const DEFAULT_DOWNLOAD_ICON = '/content/dam/hisense/us/common-icons/download.svg';

export default function decorate(block) {
  const config = readBlockConfig(block);
  const title = config.title || '';
  const subtitle = config.subtitle || '';
  const buttonText = config['button-to-download'] || '';

  const container = document.createElement('div');
  container.className = 'download-container';

  // Left side: Image list
  const imageList = document.createElement('div');
  imageList.className = 'download-image-list';

  // Right side: Download panel
  const downloadPanel = document.createElement('div');
  downloadPanel.className = 'download-panel';

  // Title
  if (title) {
    const titleEl = document.createElement('h2');
    titleEl.className = 'download-title';
    titleEl.textContent = title;
    downloadPanel.appendChild(titleEl);
  }

  // Subtitle
  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'download-subtitle';
    subtitleEl.textContent = subtitle;
    downloadPanel.appendChild(subtitleEl);
  }

  // Meta list
  const metaList = document.createElement('div');
  metaList.className = 'download-meta-list';

  const rows = [...block.children];
  rows.forEach((row) => {
    if (row.children.length < 2) return;

    const cells = [...row.children];
    const imageCell = cells[0];
    const imageName = cells[1]?.textContent.trim() || '';
    const imagePx = cells[2]?.textContent.trim() || '';
    const imageDpi = cells[3]?.textContent.trim() || '';
    const imageSize = cells[4]?.textContent.trim() || '';
    const downloadIconCell = cells[5];

    // Image item for left side
    const imageItem = document.createElement('div');
    imageItem.className = 'download-image-item';
    moveInstrumentation(row, imageItem);

    const imageImg = imageCell?.querySelector('img');
    const imageSrc = imageImg?.src || DEFAULT_ITEM_IMAGE;
    const picture = createOptimizedPicture(
      imageSrc,
      imageImg?.alt || imageName || 'Download item',
      false,
      [{ width: '120' }],
    );
    imageItem.appendChild(picture);

    imageList.appendChild(imageItem);

    // Meta item for right side
    const metaItem = document.createElement('div');
    metaItem.className = 'download-meta-item';

    const metaInfo = document.createElement('div');
    metaInfo.className = 'download-meta-info';

    if (imageName) {
      const nameEl = document.createElement('div');
      nameEl.className = 'download-meta-name';
      nameEl.textContent = imageName;
      metaInfo.appendChild(nameEl);
    }

    const specs = document.createElement('div');
    specs.className = 'download-meta-specs';
    const specParts = [];
    if (imagePx) specParts.push(imagePx);
    if (imageDpi) specParts.push(imageDpi);
    if (imageSize) specParts.push(imageSize);
    specs.textContent = specParts.join(' | ');
    metaInfo.appendChild(specs);

    metaItem.appendChild(metaInfo);

    // Download icon
    const downloadIcon = document.createElement('div');
    downloadIcon.className = 'download-icon';

    const downloadIconImg = downloadIconCell?.querySelector('img');
    const downloadIconSrc = downloadIconImg?.src || DEFAULT_DOWNLOAD_ICON;
    const downloadPicture = createOptimizedPicture(
      downloadIconSrc,
      downloadIconImg?.alt || 'Download',
      false,
      [{ width: '24' }],
    );
    downloadIcon.appendChild(downloadPicture);

    metaItem.appendChild(downloadIcon);
    metaList.appendChild(metaItem);
  });

  downloadPanel.appendChild(metaList);

  // Button
  if (buttonText) {
    const buttonEl = document.createElement('button');
    buttonEl.className = 'download-button';
    buttonEl.textContent = buttonText;
    buttonEl.addEventListener('click', () => {
      // eslint-disable-next-line no-console
      console.log('Download all clicked');
    });
    downloadPanel.appendChild(buttonEl);
  }

  container.appendChild(imageList);
  container.appendChild(downloadPanel);

  block.replaceChildren(container);
  block.classList.add('loaded');
}
