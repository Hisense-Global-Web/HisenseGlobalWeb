import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

/**
 * Headline Block
 * @param {HTMLElement} block - The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  // 提取数据
  const data = {
    'section-title': config['section-title'] || 'Featured',
    eyebrow: config.eyebrow || '',
    subtitle: config.subtitle || '',
    text: config.text || '',
    date: config.date || '',
    location: config.location || '',
    author: config.author || '',
    image: config.image || '/resources/490120ecff332a924ab425cce8dbe8a57ec0bbbf.jpg',
    ctaText: config['cta-text'] || '',
    ctaLink: config['cta-link'] || '',
    hasDownload: config['has-download'] === true || config['has-download'] === 'true' || false,
  };

  // 创建容器
  const container = document.createElement('div');
  container.className = 'featured-container';
  const blockResource = block.getAttribute('data-aue-resource');
  // 确保需要在 block 上保留的属性被设置回 block
  if (blockResource) {
    block.setAttribute('data-aue-resource', blockResource);
  }

  // 创建 section title
  const sectionTitle = document.createElement('div');
  sectionTitle.className = 'section-title';
  sectionTitle.textContent = data['section-title'] || 'Featured';
  container.appendChild(sectionTitle);

  // 创建 featured card
  const featuredCard = document.createElement('div');
  featuredCard.classList.add('featured-card');

  // 创建图片区域
  if (data.image) {
    const featuredImage = document.createElement('div');
    featuredImage.classList.add('featured-image');

    const picture = createOptimizedPicture(
      data.image,
      data.subtitle || '',
      false, // eager - 根据需求调整，LCP图片应该用true
      [{ media: '(min-width: 860px)', width: '2000' }, { width: '860' }],
    );

    featuredImage.appendChild(picture);
    featuredCard.appendChild(featuredImage);
  }

  // 创建内容区域
  const featuredContent = document.createElement('div');
  featuredContent.classList.add('featured-content');

  // Eyebrow
  if (data.eyebrow) {
    const eyebrowEl = document.createElement('span');
    eyebrowEl.classList.add('featured-eyebrow');
    eyebrowEl.textContent = data.eyebrow;
    featuredContent.appendChild(eyebrowEl);
  }

  // Subtitle/Title
  if (data.subtitle) {
    const titleEl = document.createElement('div');
    titleEl.classList.add('featured-subtitle');
    titleEl.textContent = data.subtitle;
    featuredContent.appendChild(titleEl);
  }

  // Text/Excerpt (支持富文本)
  if (data.text) {
    const excerptEl = document.createElement('div');
    excerptEl.classList.add('featured-text');
    // 如果 text 包含 HTML 标签，使用 innerHTML，否则使用 textContent
    if (data.text.includes('<')) {
      excerptEl.innerHTML = data.text;
    } else {
      excerptEl.textContent = data.text;
    }
    featuredContent.appendChild(excerptEl);
  }

  // Meta group (date and location)
  const metaGroupEl = document.createElement('div');
  metaGroupEl.classList.add('featured-meta-group');

  if (data.date) {
    const dateEl = document.createElement('span');
    dateEl.classList.add('meta-item');
    // 添加左侧图标
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/clock-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    dateEl.appendChild(iconImg);
    dateEl.appendChild(document.createTextNode(data.date));
    metaGroupEl.appendChild(dateEl);
  }

  if (data.location) {
    const locationEl = document.createElement('span');
    locationEl.classList.add('meta-item');
    // 添加左侧图标
    const iconImg = document.createElement('img');
    iconImg.src = '/resources/location-icon.svg';
    iconImg.alt = '';
    iconImg.classList.add('meta-icon');
    locationEl.appendChild(iconImg);
    locationEl.appendChild(document.createTextNode(data.location));
    metaGroupEl.appendChild(locationEl);
  }

  if (metaGroupEl.children.length > 0) {
    featuredContent.appendChild(metaGroupEl);
  }

  // Actions (CTA button)
  if (data.ctaText) {
    const actionsEl = document.createElement('div');
    actionsEl.classList.add('featured-actions');

    const button = document.createElement('button');
    // 文字带link的用这个
    // button.classList.add('text-btn');
    // button.textContent = data.ctaText;

    // download 和其他只有icon的用这个
    const iconImg = document.createElement('img');
    iconImg.src = '/content/dam/hisense/us/common-icons/download.svg';
    button.classList.add('icon-btn');
    button.appendChild(iconImg);

    // 如果有链接，包装在链接中
    if (data.ctaLink) {
      const link = document.createElement('a');
      link.href = data.ctaLink;
      link.appendChild(button);
      actionsEl.appendChild(link);
    } else {
      actionsEl.appendChild(button);
    }

    featuredContent.appendChild(actionsEl);
  }

  // 组装卡片
  featuredCard.appendChild(featuredContent);
  container.appendChild(featuredCard);

  // 使用 replaceChildren 而不是 innerHTML，以保留 block 上的属性
  block.replaceChildren(container);
  block.classList.add('loaded');
}
