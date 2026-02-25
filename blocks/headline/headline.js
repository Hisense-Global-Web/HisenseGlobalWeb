import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

async function fetchChildPageData(sourcePath) {
  const { hostname, pathname } = window.location;

  if (hostname.includes('adobeaemcloud.com')) {
    const resp = await fetch(`${sourcePath}.1.json`);
    if (!resp.ok) return null;
    const json = await resp.json();
    const content = json['jcr:content'] || {};
    return {
      title: content['jcr:title'] || '',
      subtitle: content.subtitle || '',
      keywords: Array.isArray(content.keywords) ? content.keywords.join(', ') : (content.keywords || ''),
      date: content.date || '',
      location: content.location || '',
      author: content.author || '',
      thumbnail: content.thumbnail || '',
      'cta-text': content['cta-text'] || '',
      downloadLink: content.downloadLink || '',
    };
  }

  const segments = pathname.split('/').filter(Boolean);
  const country = segments[0] || 'us';
  const language = country.toLowerCase() === 'us' ? 'en' : (segments[1] || 'en');
  const url = `/${country}/${language}/global-search.json`;

  const resp = await fetch(url, { credentials: 'same-origin' });
  if (!resp.ok) return null;
  const json = await resp.json();

  const item = json.data.find((d) => d.path === sourcePath);
  if (!item) return null;

  return {
    title: item.title || '',
    subtitle: item.subtitle || '',
    keywords: item.keywords || '',
    date: item.date || '',
    location: item.location || '',
    author: item.author || '',
    thumbnail: item.thumbnail || '',
    'cta-text': item['cta-text'] || '',
    downloadLink: item.downloadlink || '',
  };
}

/**
 * Headline Block
 * @param {HTMLElement} block - The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  let data;
  if (config['data-source'] === 'child-page' && config['source-path']) {
    const fetched = await fetchChildPageData(config['source-path']);
    if (fetched) {
      data = {
        'section-title': config['section-title'] || 'Featured',
        eyebrow: fetched.subtitle || '',
        subtitle: fetched.title || '',
        text: '',
        date: fetched.date ? formatDate(fetched.date) : '',
        location: fetched.location || '',
        author: fetched.author || '',
        image: config.image || '/resources/490120ecff332a924ab425cce8dbe8a57ec0bbbf.jpg',
        ctaText: fetched['cta-text'] || '',
        ctaLink: config['cta-link'] || '',
        hasDownload: !!fetched.downloadLink,
      };
    }
  }

  if (!data) {
    data = {
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
  }

  const container = document.createElement('div');
  container.className = 'featured-container';
  const blockResource = block.getAttribute('data-aue-resource');
  if (blockResource) {
    block.setAttribute('data-aue-resource', blockResource);
  }

  const sectionTitle = document.createElement('div');
  sectionTitle.className = 'section-title';
  sectionTitle.textContent = data['section-title'] || 'Featured';
  container.appendChild(sectionTitle);

  const featuredCard = document.createElement('div');
  featuredCard.classList.add('featured-card');

  if (data.image) {
    const featuredImage = document.createElement('div');
    featuredImage.classList.add('featured-image');

    const picture = createOptimizedPicture(
      data.image,
      data.subtitle || '',
      false,
      [{ media: '(min-width: 860px)', width: '2000' }, { width: '860' }],
    );

    featuredImage.appendChild(picture);
    featuredCard.appendChild(featuredImage);
  }

  const featuredContent = document.createElement('div');
  featuredContent.classList.add('featured-content');

  if (data.eyebrow) {
    const eyebrowEl = document.createElement('span');
    eyebrowEl.classList.add('featured-eyebrow');
    eyebrowEl.textContent = data.eyebrow;
    featuredContent.appendChild(eyebrowEl);
  }

  if (data.subtitle) {
    const titleEl = document.createElement('div');
    titleEl.classList.add('featured-subtitle');
    titleEl.textContent = data.subtitle;
    featuredContent.appendChild(titleEl);
  }

  if (data.text) {
    const excerptEl = document.createElement('div');
    excerptEl.classList.add('featured-text');
    if (data.text.includes('<')) {
      excerptEl.innerHTML = data.text;
    } else {
      excerptEl.textContent = data.text;
    }
    featuredContent.appendChild(excerptEl);
  }

  const metaGroupEl = document.createElement('div');
  metaGroupEl.classList.add('featured-meta-group');

  if (data.date) {
    const dateEl = document.createElement('span');
    dateEl.classList.add('meta-item');
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

  if (data.ctaText) {
    const actionsEl = document.createElement('div');
    actionsEl.classList.add('featured-actions');

    const button = document.createElement('button');

    const iconImg = document.createElement('img');
    iconImg.src = '/content/dam/hisense/us/common-icons/download.svg';
    button.classList.add('icon-btn');
    button.appendChild(iconImg);

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

  featuredCard.appendChild(featuredContent);
  container.appendChild(featuredCard);

  block.replaceChildren(container);
  block.classList.add('loaded');
}
