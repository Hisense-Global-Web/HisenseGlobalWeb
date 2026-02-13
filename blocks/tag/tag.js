const TAG_DATA_URL = 'https://publish-p174152-e1909940.adobeaemcloud.com/content/cq:tags/hisense.-1.json';

/**
 * Transform tag data to handle new GraphQL format
 */
function transformTagData(data) {
  if (!data) return null;

  if (data.tags) {
    return data.tags;
  }

  if (data.data && Array.isArray(data.data)) {
    return data.data[0] || data;
  }

  const topLevelKeys = Object.keys(data).filter((key) => !key.startsWith('jcr:')
    && key !== 'sling:resourceType'
    && key !== 'jcr:primaryType');

  if (topLevelKeys.length > 0) {
    return data;
  }

  // Default fallback
  return data;
}

/**
 * Fetch tag data from API
 */
async function fetchTagData() {
  try {
    const response = await fetch(window.TAGS_DATA_URL || TAG_DATA_URL);
    if (response.ok) {
      const data = await response.json();
      return transformTagData(data);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to fetch tag data:', error);
  }
  return null;
}

/**
 * Get tag title from tag data
 */
function getTagTitle(tagPath, tagData) {
  if (!tagData || !tagData.data || tagData.data.length === 0) {
    return tagPath.split(':').pop().split('/').pop();
  }

  const pathParts = tagPath.split(':').pop().split('/');

  const result = pathParts.reduce((current, part) => {
    if (current && current[part]) {
      return current[part];
    }
    return null;
  }, tagData.data[0]);

  return result?.['jcr:title'] || pathParts[pathParts.length - 1];
}

/**
 * Read block configuration for key-value mode
 */
function readTagConfig(block) {
  const rows = [...block.children];
  const config = {
    title: '',
    tagPaths: [],
    tagsEndpoint: '/content/dam/hisense/us/tag-data/en/tag-data.json', // New: tags endpoint URL
    link: '',
    target: '_self',
  };

  if (rows[0]?.children.length === 2) {
    rows.forEach((row) => {
      if (row.children.length === 2) {
        const key = row.children[0].textContent.trim().toLowerCase();
        const valueCell = row.children[1];

        if (key === 'tagsendpoint') {
          config.tagsEndpoint = valueCell.textContent.trim();
        }
      }
    });

    // Store tags for API lookup
    if (rows[1]) {
      const text = rows[1].textContent.trim();
      if (text && text.includes(',') && text.includes(',')) {
        config.tagPaths = text.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    return config;
  }

  if (rows[0]?.children.length === 2) {
    // Author mode: read key-value pairs
    rows.forEach((row) => {
      if (row.children.length === 2) {
        const key = row.children[0].textContent.trim().toLowerCase();
        const valueCell = row.children[1];
        if (key === 'title') {
          config.title = valueCell.textContent.trim();
        } else if (key === 'tags') {
          // Tags can be links (aem-tag) or comma-separated text
          const links = valueCell.querySelectorAll('a');
          if (links.length > 0) {
            // Extract full tag paths from links
            config.tagPaths = [...links].map((link) => link.textContent.trim());
          } else {
            // Fallback: comma-separated text (store as-is)
            const text = valueCell.textContent.trim();
            config.tagPaths = text.split(',').map((tag) => tag.trim()).filter(Boolean);
          }
        } else if (key === 'link') {
          const linkEl = valueCell.querySelector('a');
          config.link = linkEl ? linkEl.getAttribute('href') : valueCell.textContent.trim();
        } else if (key === 'target') {
          config.target = valueCell.textContent.trim() || '_self';
        }
      }
    });
  } else {
    // Publish mode: sequential rows
    if (rows[0]) config.title = rows[0].textContent.trim();
    if (rows[1]) {
      // Tags row - can contain links or text
      const links = rows[1].querySelectorAll('a');
      if (links.length > 0) {
        config.tagPaths = [...links].map((link) => link.textContent.trim());
      } else {
        const text = rows[1].textContent.trim();
        config.tagPaths = text.split(',').map((tag) => tag.trim()).filter(Boolean);
      }
    }
    if (rows[2]) {
      const linkEl = rows[2].querySelector('a');
      config.link = linkEl ? linkEl.getAttribute('href') : rows[2].textContent.trim();
    }
    if (rows[3]) {
      config.target = rows[3].textContent.trim() || '_self';
    }
  }

  return config;
}

export default async function decorate(block) {
  const config = readTagConfig(block);

  // Store tags endpoint globally for fetchTagData function
  if (config.tagsEndpoint) {
    window.TAGS_DATA_URL = config.tagsEndpoint;
  }

  const {
    title,
    tagPaths,
    link,
    target,
  } = config;

  const tagData = await fetchTagData();

  const container = document.createElement('div');
  container.className = 'tag-container';

  // Title
  if (title) {
    const titleEl = document.createElement('h2');
    titleEl.className = 'tag-title';
    titleEl.textContent = title;
    container.appendChild(titleEl);
  }

  // Tags list
  if (tagPaths && tagPaths.length > 0) {
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';

    tagPaths.forEach((tagPath) => {
      const tagName = tagPath.split(':').pop().split('/').pop();

      if (link) {
        const tagEl = document.createElement('a');
        tagEl.className = 'tag-item';
        const separator = link.includes('?') ? '&' : '?';
        tagEl.href = `${link}${separator}fulltext=${tagName}`;
        tagEl.target = target;
        tagEl.textContent = getTagTitle(tagPath, tagData);
        tagList.appendChild(tagEl);
      } else {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item';
        tagEl.textContent = getTagTitle(tagPath, tagData);
        tagList.appendChild(tagEl);
      }
    });

    container.appendChild(tagList);
  }

  block.replaceChildren(container);
  block.classList.add('loaded');
}
