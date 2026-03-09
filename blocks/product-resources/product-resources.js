import { readBlockConfig } from '../../scripts/aem.js';
import { getLocaleFromPath } from '../../scripts/locale-utils.js';
import getDynamicHeaderHeight from '../../utils/dynamic-computed-header-height.js';

const ARROW_LEFT_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path class="circle" d="M14 0.5C6.544 0.5 0.5 6.544 0.5 14C0.5 21.456 6.544 27.5 14 27.5C21.456 27.5 27.5 21.456 27.5 14C27.5 6.544 21.456 0.5 14 0.5Z" stroke="#BBBBBB"/>
  <path class="arrow" d="M16 8L10.743 12.774C10.333 13.146 10.304 13.781 10.678 14.189L16 20" stroke="#BBBBBB" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const ARROW_RIGHT_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path class="circle" d="M14 0.5C21.456 0.5 27.5 6.544 27.5 14C27.5 21.456 21.456 27.5 14 27.5C6.544 27.5 0.5 21.456 0.5 14C0.5 6.544 6.544 0.5 14 0.5Z" stroke="#009F9C"/>
  <path class="arrow" d="M12 8L17.257 12.774C17.667 13.146 17.696 13.781 17.322 14.189L12 20" stroke="#009F9C" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const VISIBLE_COUNT = 3;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const DEFAULT_DOCUMENTATION_EMPTY = 'No documentation available.';
const DEFAULT_FIRMWARE_EMPTY = 'No firmware resource available.';
const DEFAULT_WARRANTY_EMPTY = 'No warranty information available.';
const DEFAULT_NO_RESULT_CONTENT = '<p>No resources available for this product.</p>';
const DEFAULT_PRODUCT_NOT_FOUND = '<p>Product not found.</p>';
const DEFAULT_AUTHOR_SKU = '43A65H';

function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

function normalizeConfigKey(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readRichtextConfig(block, fieldName) {
  const normalizedFieldName = normalizeConfigKey(fieldName);
  const row = [...block.querySelectorAll(':scope > div')].find((item) => {
    const keyCell = item.children?.[0];
    return normalizeConfigKey(keyCell?.textContent || '') === normalizedFieldName;
  });

  return row?.children?.[1]?.innerHTML?.trim() || '';
}

function isAemEnvironment() {
  const hostname = window.location.hostname || '';
  return hostname.includes('author') || hostname.includes('publish');
}

function isAuthorEnvironment() {
  const hostname = window.location.hostname || '';
  return hostname.includes('author');
}

function getSkuFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const sku = (params.get('sku') || '').trim();
  if (sku) return sku;
  if (isAuthorEnvironment()) return DEFAULT_AUTHOR_SKU;
  return '';
}

function getBaseUrl() {
  return window.GRAPHQL_BASE_URL || '';
}

function toAbsoluteUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;

  const shouldPrefixBaseUrl = ['/bin/', '/product/', '/content/dam/']
    .some((prefix) => path.startsWith(prefix));
  if (!shouldPrefixBaseUrl) return path;

  const baseUrl = getBaseUrl();
  if (!baseUrl) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function getCacheBustedUrl(url) {
  if (!url) return '';
  const cacheBuster = simpleHash(Math.floor(Date.now() / FIVE_MINUTES_MS));
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${cacheBuster}`;
}

function getProductEndpoint(country, language, sku) {
  if (!country || !language || !sku) return '';

  if (isAemEnvironment()) {
    return `/bin/hisense/productListBySku.json?path=/${country}/${language}&sku=${encodeURIComponent(sku)}`;
  }

  return `/product/sku/${country}/${language}/${encodeURIComponent(sku)}.json`;
}

function getSupportEndpoint(country, language, factoryModel, category, sku) {
  if (!country || !language || !factoryModel || !category) return '';
  const params = new URLSearchParams({
    country,
    language,
    factoryModel,
    category,
  });
  if (sku) {
    params.set('sku', sku);
  }
  return `/bin/hisense/support/document.json?${params.toString()}`;
}

function normalizeProductResponse(data) {
  return data?.data?.productModelList?.items?.[0] || null;
}

function normalizeSupportResponse(data) {
  return {
    documentationTitle: data?.documentationTitle || 'Documentation',
    documents: Array.isArray(data?.documents) ? data.documents : [],
    warrantyTitle: data?.warrantyTitle || 'Warranty',
    warranty: Array.isArray(data?.warranty) ? data.warranty : [],
  };
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

function formatTabLabel(label, fallback) {
  const text = String(label || fallback || '').trim();
  if (!text) return fallback;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildProductInformation(product) {
  const section = document.createElement('div');
  section.className = 'product-information';

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
    section.appendChild(imageWrapper);
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

  section.appendChild(textWrapper);
  return section;
}

function buildSectionTitle(titleText) {
  const titleElement = document.createElement('p');
  titleElement.className = 'title';
  titleElement.textContent = titleText;
  return titleElement;
}

function buildRichMessage(html, modifierClass) {
  const wrapper = document.createElement('div');
  wrapper.className = `product-resources-message ${modifierClass}`;
  wrapper.innerHTML = html;
  return wrapper;
}

function createEmptyStateItem(message) {
  const listItem = document.createElement('li');
  listItem.className = 'item-empty-wrapper';

  const item = document.createElement('div');
  item.className = 'item item-empty';

  const text = document.createElement('p');
  text.className = 'item-empty-text';
  text.textContent = message;

  item.appendChild(text);
  listItem.appendChild(item);
  return listItem;
}

function createPictureContainer(imageSrc, altText) {
  const pictureContainer = document.createElement('div');
  pictureContainer.className = 'item-picture-container';

  const picture = document.createElement('img');
  picture.className = 'item-picture';
  picture.src = imageSrc;
  picture.alt = altText;
  pictureContainer.appendChild(picture);

  return pictureContainer;
}

function createDescriptionList(items, withIcon = false, iconSrc = '') {
  const list = document.createElement('ul');
  list.className = 'item-description';

  items.filter(Boolean).forEach((entry) => {
    const item = document.createElement('li');

    if (withIcon && iconSrc) {
      const icon = document.createElement('img');
      icon.className = 'item-description-icon';
      icon.src = iconSrc;
      icon.alt = '';
      item.appendChild(icon);
    }

    const text = document.createElement('span');
    text.className = 'item-description-text';
    text.textContent = entry;
    item.appendChild(text);
    list.appendChild(item);
  });

  return list;
}

function createCtaLink(text, href) {
  const link = document.createElement('a');
  link.className = 'item-cta';
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const label = document.createElement('span');
  label.className = 'item-cta-text';
  label.textContent = text;
  link.appendChild(label);
  return link;
}

function createDocumentationItem(documentItem, country) {
  const listItem = document.createElement('li');
  const item = document.createElement('div');
  item.className = 'item';

  const iconPath = toAbsoluteUrl(`/content/dam/hisense/${country}/common-icons/download.svg`);
  item.appendChild(createPictureContainer(iconPath, 'Download'));

  const title = document.createElement('p');
  title.className = 'item-title';
  title.textContent = documentItem?.title || '';
  item.appendChild(title);

  const metadata = [];
  if (documentItem?.type) metadata.push(String(documentItem.type).toUpperCase());
  if (documentItem?.size) metadata.push(documentItem.size);
  item.appendChild(createDescriptionList(metadata));

  if (documentItem?.link) {
    item.appendChild(createCtaLink('Download', toAbsoluteUrl(documentItem.link)));
  }

  listItem.appendChild(item);
  return listItem;
}

function createFirmwareItem(config) {
  const listItem = document.createElement('li');
  const item = document.createElement('div');
  item.className = 'item';

  const iconSrc = toAbsoluteUrl(config.firmwareicon || '/resources/news-pagination-arrow.svg');
  item.appendChild(createPictureContainer(iconSrc, 'Firmware'));

  const title = document.createElement('p');
  title.className = 'item-title';
  title.textContent = config.firmware || config.firmwaretitle || 'Find Latest Firmware Update';
  item.appendChild(title);

  if (config.firmwarelink && (config.firmwarebutton || config.firmwarebuttontext)) {
    item.appendChild(createCtaLink(
      config.firmwarebutton || config.firmwarebuttontext,
      toAbsoluteUrl(config.firmwarelink),
    ));
  }

  listItem.appendChild(item);
  return listItem;
}

function createWarrantyItem(warrantyItem, country) {
  const listItem = document.createElement('li');
  const item = document.createElement('div');
  item.className = 'item';

  const defaultIcon = `/content/dam/hisense/${country}/common-icons/global.svg`;
  const warrantyIcon = toAbsoluteUrl(warrantyItem?.warrantyInfoIcon || defaultIcon);
  item.appendChild(createPictureContainer(warrantyIcon, 'Warranty'));

  const title = document.createElement('p');
  title.className = 'item-title';
  title.textContent = warrantyItem?.warrantyInfoTitle || 'Warranty';
  item.appendChild(title);

  const warrantyInfo = Array.isArray(warrantyItem?.warrantyInfo) ? warrantyItem.warrantyInfo : [];
  if (warrantyInfo.length > 0) {
    item.appendChild(createDescriptionList(warrantyInfo, false));
  }

  if (warrantyItem?.warrantyInfoNotes) {
    const reminder = document.createElement('div');
    reminder.className = 'item-reminder';

    const reminderText = document.createElement('p');
    reminderText.className = 'item-reminder-text';
    reminderText.textContent = warrantyItem.warrantyInfoNotes;
    reminder.appendChild(reminderText);

    item.appendChild(reminder);
  }

  listItem.appendChild(item);
  return listItem;
}

function createTabContent(type, items, isActive) {
  const content = document.createElement('div');
  content.className = `tab-content${isActive ? ' active' : ''}`;
  content.setAttribute('type', type);

  const list = document.createElement('ul');
  list.className = 'tab-content-ul';
  items.forEach((item) => list.appendChild(item));
  content.appendChild(list);

  return content;
}

function buildTabsSection(tabConfigs, activeType) {
  const wrapper = document.createDocumentFragment();

  const header = document.createElement('div');
  header.className = 'tabs-header';

  const tabs = document.createElement('ul');
  tabs.className = 'tabs';

  tabConfigs.forEach((tabConfig) => {
    const tab = document.createElement('li');
    tab.className = `tab${tabConfig.type === activeType ? ' active' : ''}`;
    tab.setAttribute('type', tabConfig.type);

    const label = document.createElement('p');
    label.textContent = tabConfig.label;
    tab.appendChild(label);
    tabs.appendChild(tab);
  });

  const carouselNav = document.createElement('div');
  carouselNav.className = 'carousel-nav';
  carouselNav.style.display = 'none';

  const prevButton = document.createElement('button');
  prevButton.className = 'carousel-prev disabled';
  prevButton.setAttribute('aria-label', 'Previous');
  prevButton.innerHTML = ARROW_LEFT_SVG;

  const nextButton = document.createElement('button');
  nextButton.className = 'carousel-next';
  nextButton.setAttribute('aria-label', 'Next');
  nextButton.innerHTML = ARROW_RIGHT_SVG;

  carouselNav.append(prevButton, nextButton);
  header.append(tabs, carouselNav);
  wrapper.appendChild(header);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'tab-content-wrapper';

  tabConfigs.forEach((tabConfig) => {
    contentWrapper.appendChild(createTabContent(tabConfig.type, tabConfig.items, tabConfig.type === activeType));
  });

  wrapper.appendChild(contentWrapper);
  return wrapper;
}

function initTabsAndCarousel(block) {
  const tabs = block.querySelectorAll('.tab');
  const tabContents = block.querySelectorAll('.tab-content');
  const carouselNav = block.querySelector('.carousel-nav');
  const prevBtn = block.querySelector('.carousel-prev');
  const nextBtn = block.querySelector('.carousel-next');

  if (!tabs.length || !tabContents.length || !carouselNav || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  function getActiveContent() {
    return block.querySelector('.tab-content.active');
  }

  function getTrack(content) {
    return content?.querySelector('.tab-content-ul') || null;
  }

  function getItems(content) {
    return content?.querySelectorAll('.tab-content-ul > li') || [];
  }

  function getItemWidth(content) {
    const items = getItems(content);
    if (!items.length) return 0;
    const firstItem = items[0].querySelector('.item');
    return firstItem?.offsetWidth || 0;
  }

  function getGap(content) {
    const track = getTrack(content);
    if (!track) return 24;
    return parseFloat(getComputedStyle(track).gap) || 24;
  }

  function getMaxIndex(content) {
    const count = getItems(content).length;
    if (count <= VISIBLE_COUNT) return 0;
    return count - VISIBLE_COUNT;
  }

  function isMobile() {
    return window.innerWidth < 860;
  }

  function updateCarousel() {
    const content = getActiveContent();
    const track = getTrack(content);
    const count = getItems(content).length;

    if (isMobile() || count <= VISIBLE_COUNT) {
      carouselNav.style.display = 'none';
      if (track) track.style.transform = 'translateX(0)';
      return;
    }

    carouselNav.style.display = 'flex';
    const offset = currentIndex * (getItemWidth(content) + getGap(content));
    if (track) track.style.transform = `translateX(-${offset}px)`;

    const maxIndex = getMaxIndex(content);
    prevBtn.classList.toggle('disabled', currentIndex <= 0);
    nextBtn.classList.toggle('disabled', currentIndex >= maxIndex);
  }

  function switchTab(type) {
    tabs.forEach((tab) => tab.classList.toggle('active', tab.getAttribute('type') === type));
    tabContents.forEach((content) => content.classList.toggle('active', content.getAttribute('type') === type));
    currentIndex = 0;
    updateCarousel();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.getAttribute('type')));
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    const maxIndex = getMaxIndex(getActiveContent());
    if (currentIndex < maxIndex) {
      currentIndex += 1;
      updateCarousel();
    }
  });

  window.addEventListener('resize', updateCarousel);
  updateCarousel();
}

function getFirmwareState(config) {
  const title = (config.firmware || config.firmwaretitle || '').trim();
  const buttonText = (config.firmwarebutton || config.firmwarebuttontext || '').trim();
  const link = (config.firmwarelink || '').trim();
  const icon = (config.firmwareicon || '').trim();

  return {
    hasContent: Boolean(title || buttonText || link || icon),
    title,
    buttonText,
    link,
    icon,
  };
}

function buildTabConfigs(config, supportData, country) {
  const firmwareState = getFirmwareState(config);
  const documents = supportData.documents.length
    ? supportData.documents.map((item) => createDocumentationItem(item, country))
    : [createEmptyStateItem(DEFAULT_DOCUMENTATION_EMPTY)];
  const firmwareItems = firmwareState.hasContent
    ? [createFirmwareItem(config)]
    : [createEmptyStateItem(DEFAULT_FIRMWARE_EMPTY)];
  const warrantyItems = supportData.warranty.length
    ? supportData.warranty.map((item) => createWarrantyItem(item, country))
    : [createEmptyStateItem(DEFAULT_WARRANTY_EMPTY)];

  return {
    hasAnyTabData: supportData.documents.length > 0 || supportData.warranty.length > 0 || firmwareState.hasContent,
    tabs: [
      {
        type: 'documentation',
        label: formatTabLabel(supportData.documentationTitle, 'Documentation'),
        items: documents,
        hasData: supportData.documents.length > 0,
      },
      {
        type: 'firmware',
        label: 'Firmware',
        items: firmwareItems,
        hasData: firmwareState.hasContent,
      },
      {
        type: 'warranty',
        label: formatTabLabel(supportData.warrantyTitle, 'Warranty'),
        items: warrantyItems,
        hasData: supportData.warranty.length > 0,
      },
    ],
  };
}

function getInitialActiveTab(tabConfigs) {
  return tabConfigs.find((tab) => tab.hasData)?.type || tabConfigs[0]?.type || 'documentation';
}

function renderMessageState(block, titleText, messageHtml, modifierClass) {
  block.textContent = '';
  block.appendChild(buildSectionTitle(titleText));
  block.appendChild(buildRichMessage(messageHtml, modifierClass));
  block.classList.add('loaded');
}

function renderNoResultState(block, product, titleText, messageHtml) {
  block.textContent = '';
  block.appendChild(buildProductInformation(product));
  block.appendChild(buildSectionTitle(titleText));
  block.appendChild(buildRichMessage(messageHtml, 'no-result'));
  block.classList.add('loaded');
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  config.noresultcontent = readRichtextConfig(block, 'noResultContent') || config.noresultcontent || '';
  config.productnotfoundmessage = readRichtextConfig(block, 'productNotFoundMessage') || config.productnotfoundmessage || '';

  const titleText = config.title || 'Resources';
  const sku = getSkuFromUrl();
  const { country, language } = getLocaleFromPath();

  if (!sku) {
    renderMessageState(
      block,
      titleText,
      config.productnotfoundmessage || DEFAULT_PRODUCT_NOT_FOUND,
      'product-not-found',
    );
    return;
  }

  let product = null;
  try {
    const productEndpoint = getProductEndpoint(country, language, sku);
    const productData = await fetchJson(productEndpoint);
    product = normalizeProductResponse(productData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('product-resources: failed to fetch product data', error);
  }

  if (!product) {
    renderMessageState(
      block,
      titleText,
      config.productnotfoundmessage || DEFAULT_PRODUCT_NOT_FOUND,
      'product-not-found',
    );
    return;
  }

  let supportData = normalizeSupportResponse(null);
  try {
    const supportEndpoint = getSupportEndpoint(
      country,
      language,
      product.factoryModel,
      product.category,
      product.sku || sku,
    );
    const supportResponse = await fetchJson(supportEndpoint);
    supportData = normalizeSupportResponse(supportResponse);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('product-resources: failed to fetch support data', error);
  }

  const tabState = buildTabConfigs(config, supportData, country);

  if (!tabState.hasAnyTabData) {
    renderNoResultState(
      block,
      product,
      titleText,
      config.noresultcontent || DEFAULT_NO_RESULT_CONTENT,
    );
    return;
  }

  block.textContent = '';
  block.appendChild(buildProductInformation(product));
  block.appendChild(buildSectionTitle(titleText));
  block.appendChild(buildTabsSection(tabState.tabs, getInitialActiveTab(tabState.tabs)));

  initTabsAndCarousel(block);
  block.classList.add('loaded');
  getDynamicHeaderHeight(block);
}
