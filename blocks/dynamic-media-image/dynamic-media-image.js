function getCurrentLocationHref() {
  if (typeof window !== 'undefined' && window.location?.href) {
    return window.location.href;
  }

  return 'http://localhost:3000/';
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPositiveNumber(value) {
  const number = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function getFieldValue(item, names) {
  const nameSet = new Set(names.map(normalizeKey));
  const entry = Object.entries(item || {}).find(([key]) => nameSet.has(normalizeKey(key)));
  return entry ? entry[1] : '';
}

function getCellValue(cell) {
  const link = cell?.querySelector?.('a[href]');
  if (link?.href) return link.href;

  const image = cell?.querySelector?.('img[src]');
  if (image?.src) return image.src;

  return cell?.textContent?.trim?.() || '';
}

function getKeyValueRows(root) {
  const config = {};

  root?.querySelectorAll?.(':scope > div').forEach((row) => {
    const cells = [...(row.children || [])];
    if (cells.length !== 2) return;

    const key = normalizeKey(cells[0].textContent);
    if (!key) return;

    config[key] = getCellValue(cells[1]);
  });

  return config;
}

function getEntryKey(entry) {
  return normalizeKey(entry?.[0]);
}

function getEntryValue(entry, index) {
  return String(entry?.[index] || '').trim();
}

function getDomEntries(block) {
  return [...(block?.children || [])].map((row) => [...(row.children || [])].map(getCellValue));
}

function readCropItem(row) {
  const nestedConfig = getKeyValueRows(row);
  const nestedCropName = nestedConfig['crop-name'] || nestedConfig.cropname;
  const nestedCropWidth = nestedConfig['crop-width'] || nestedConfig.cropwidth;
  const nestedCropHeight = nestedConfig['crop-height'] || nestedConfig.cropheight;

  if (nestedCropName || nestedCropWidth || nestedCropHeight) {
    return {
      cropName: nestedCropName,
      cropWidth: nestedCropWidth,
      cropHeight: nestedCropHeight,
    };
  }

  const cells = [...(row?.children || [])];
  if (cells.length < 3) return null;

  return {
    cropName: getCellValue(cells[0]),
    cropWidth: getCellValue(cells[1]),
    cropHeight: getCellValue(cells[2]),
  };
}

function readImageReferenceFromBlock(block) {
  const config = getKeyValueRows(block);
  const image = config.image || config['image-reference'];

  if (image) return image;

  const link = block.querySelector?.('a[href]');
  if (link?.href) return link.href;

  const img = block.querySelector?.('img[src]');
  return img?.src || '';
}

function moveInstrumentationAttributes(from, to) {
  [...(from?.attributes || [])]
    .filter(({ nodeName }) => nodeName.startsWith('data-aue-') || nodeName.startsWith('data-richtext-'))
    .forEach(({ nodeName, nodeValue }) => {
      to.setAttribute(nodeName, nodeValue);
      from.removeAttribute(nodeName);
    });
}

export function buildSmartCropUrl(src, cropName, currentLocationHref = getCurrentLocationHref()) {
  if (!src || !cropName) return '';

  const assetUrl = new URL(src, currentLocationHref);
  const currentUrl = new URL(currentLocationHref);

  assetUrl.search = '';
  assetUrl.searchParams.set('smartcrop', String(cropName).trim());
  assetUrl.hash = '';

  if (assetUrl.origin === currentUrl.origin) {
    return `${assetUrl.pathname}${assetUrl.search}`;
  }

  return assetUrl.toString();
}

export function normalizeCropItems(items = []) {
  return items
    .map((item) => {
      const cropName = String(getFieldValue(item, ['cropName', 'crop-name', 'crop name']) || '').trim();
      const cropWidth = toPositiveNumber(getFieldValue(item, ['cropWidth', 'crop-width', 'crop width']));
      const cropHeight = toPositiveNumber(getFieldValue(item, ['cropHeight', 'crop-height', 'crop height']));

      return {
        cropName,
        cropWidth,
        cropHeight,
      };
    })
    .filter(({ cropName, cropWidth }) => cropName && cropWidth)
    .sort((a, b) => a.cropWidth - b.cropWidth);
}

export function readDynamicMediaImageConfig(source) {
  const entries = Array.isArray(source) ? source : getDomEntries(source);
  let imageReference = '';
  const cropItems = [];
  const flatCropValues = [];

  entries.forEach((entry) => {
    const key = getEntryKey(entry);

    if ((key === 'image' || key === 'image-reference') && getEntryValue(entry, 1)) {
      imageReference = getEntryValue(entry, 1);
      return;
    }

    if (entry.length >= 3) {
      cropItems.push({
        cropName: getEntryValue(entry, 0),
        cropWidth: getEntryValue(entry, 1),
        cropHeight: getEntryValue(entry, 2),
      });
      return;
    }

    if (entry.length === 1 && getEntryValue(entry, 0)) {
      flatCropValues.push(getEntryValue(entry, 0));
    }
  });

  for (let index = 0; index < flatCropValues.length; index += 3) {
    cropItems.push({
      cropName: flatCropValues[index],
      cropWidth: flatCropValues[index + 1],
      cropHeight: flatCropValues[index + 2],
    });
  }

  return {
    imageReference,
    cropItems: normalizeCropItems(cropItems),
  };
}

export function buildPictureSources(src, cropItems, currentLocationHref = getCurrentLocationHref()) {
  return normalizeCropItems(cropItems)
    .map(({ cropName, cropWidth, cropHeight }) => {
      const source = {
        media: `(max-width: ${cropWidth}px)`,
        srcset: buildSmartCropUrl(src, cropName, currentLocationHref),
        width: String(cropWidth),
      };

      if (cropHeight) {
        source.height = String(cropHeight);
      }

      return source;
    });
}

function createDynamicMediaPicture(src, cropItems, alt = '') {
  const picture = document.createElement('picture');
  buildPictureSources(src, cropItems).forEach((sourceConfig) => {
    const source = document.createElement('source');
    source.setAttribute('media', sourceConfig.media);
    source.setAttribute('srcset', sourceConfig.srcset);
    source.setAttribute('width', sourceConfig.width);
    if (sourceConfig.height) source.setAttribute('height', sourceConfig.height);
    picture.appendChild(source);
  });

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  picture.appendChild(img);

  return picture;
}

export default function decorate(block) {
  const parsedConfig = readDynamicMediaImageConfig(block);
  const imageReference = parsedConfig.imageReference || readImageReferenceFromBlock(block);
  const cropItems = parsedConfig.cropItems.length
    ? parsedConfig.cropItems
    : normalizeCropItems([...block.children].map(readCropItem).filter(Boolean));

  if (!imageReference) {
    block.classList.add('loaded');
    return;
  }

  const picture = createDynamicMediaPicture(imageReference, cropItems);
  moveInstrumentationAttributes(block, picture);

  block.replaceChildren(picture);
  block.classList.add('loaded');
}
