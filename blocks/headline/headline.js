import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';
import { handleCommonDownloadClick } from '../../utils/download.js';

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getSourcePathFromBlock(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const matched = rows.find((row) => {
    const cols = [...row.children];
    return cols[0]?.textContent?.trim().toLowerCase() === 'source-path' && cols[1];
  });
  if (!matched) return null;
  const anchor = matched.children[1].querySelector('a');
  if (!anchor) return null;
  return {
    aemPath: anchor.textContent.trim(),
    relativePath: new URL(anchor.href, window.location.origin).pathname,
  };
}

async function fetchChildPageData(sourcePathInfo) {
  const { hostname, pathname } = window.location;

  if (hostname.includes('adobeaemcloud.com')) {
    const resp = await fetch(`${sourcePathInfo.aemPath}.1.json`);
    if (!resp.ok) return null;
    const json = await resp.json();
    const content = json['jcr:content'] || {};
    return {
      title: content['jcr:title'] || '',
      subtitle: content.subtitle || '',
      text: content['jcr:description'] || '',
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

  const matchPath = sourcePathInfo.relativePath;
  const item = json.data.find((d) => d.path === matchPath);
  if (!item) return null;

  return {
    title: item.title || '',
    subtitle: item.subtitle || '',
    text: item.description || '',
    keywords: item.keywords || '',
    date: item.date || '',
    location: item.location || '',
    author: item.author || '',
    thumbnail: item.thumbnail || '',
    'cta-text': item['cta-text'] || 'Read now',
    downloadLink: item.downloadlink || '',
    matchPath,
  };
}

/**
 * Headline Block
 * @param {HTMLElement} block - The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);

  let data;
  if (config['data-source'] === 'child-page') {
    const sourcePathInfo = getSourcePathFromBlock(block);
    if (sourcePathInfo) {
      const fetched = await fetchChildPageData(sourcePathInfo);
      if (fetched) {
        data = {
          'section-title': config['section-title'] || 'Featured',
          eyebrow: fetched.subtitle || '',
          subtitle: fetched.title || '',
          text: fetched.text || '',
          date: fetched.date ? formatDate(fetched.date) : '',
          location: fetched.location || '',
          author: fetched.author || '',
          image: config.image || '/resources/490120ecff332a924ab425cce8dbe8a57ec0bbbf.jpg',
          ctaText: fetched['cta-text'] || '',
          ctaLink: config['cta-link'] || '',
          hasDownload: !!fetched.downloadLink,
          downloadLink: fetched.downloadLink || '',
          matchPath: fetched.matchPath,
        };
      }
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
      downloadLink: '',
      matchPath: config['match-path'] || '',
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

  if (window.location.pathname.indexOf('blog') !== -1) {
    const authorMetaGroupEl = document.createElement('div');
    authorMetaGroupEl.classList.add('featured-author-meta-group');
    const authorEl = document.createElement('div');
    authorEl.classList.add('meta-author');
    authorEl.innerHTML = data.author;
    authorMetaGroupEl.appendChild(authorEl);
    if (data.date) {
      const dateEl = document.createElement('span');
      dateEl.classList.add('meta-item');
      const iconImg = document.createElement('img');
      iconImg.src = '/resources/clock-icon.svg';
      iconImg.alt = '';
      iconImg.classList.add('meta-icon');
      dateEl.appendChild(iconImg);
      dateEl.appendChild(document.createTextNode(data.date));
      authorMetaGroupEl.appendChild(dateEl);
    }
    featuredContent.appendChild(authorMetaGroupEl);
  } else {
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
      const children = Array.from(metaGroupEl.children);
      for (let i = children.length - 2; i >= 0; i -= 1) {
        const lineEl = document.createElement('div');
        lineEl.className = 'line';
        children[i].after(lineEl);
      }
      featuredContent.appendChild(metaGroupEl);
    }
  }

  if (data.ctaText || data.downloadLink) {
    const actionsEl = document.createElement('div');
    actionsEl.classList.add('featured-actions');

    if (data.ctaText) {
      const button = document.createElement('button');
      button.classList.add('text-btn');
      button.textContent = data.ctaText;
      if (data.matchPath) {
        const link = document.createElement('a');
        link.href = data.matchPath;
        link.appendChild(button);
        actionsEl.appendChild(link);
      } else {
        actionsEl.appendChild(button);
      }
    }

    if (data.downloadLink) {
      const button = document.createElement('button');
      button.classList.add('icon-btn');
      const iconImg = document.createElement('img');
      const segments = window.location.pathname.split('/').filter(Boolean);
      const country = segments[segments[0] === 'content' ? 2 : 0] || '';
      iconImg.src = `/content/dam/hisense/${country}/common-icons/download.svg`;
      iconImg.alt = 'Download';
      button.addEventListener('click', () => handleCommonDownloadClick(data.downloadLink));
      button.appendChild(iconImg);
      actionsEl.appendChild(button);
    }

    featuredContent.appendChild(actionsEl);
  }

  featuredCard.appendChild(featuredContent);
  container.appendChild(featuredCard);

  block.replaceChildren(container);
  block.classList.add('loaded');
}
