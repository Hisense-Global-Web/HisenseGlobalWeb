const TAG_DATA_URL = '/content/dam/hisense/us/tag-data/en/tag-data.json';

/**
 * Fetch tag data from API
 */
async function fetchTagData() {
  try {
    const response = await fetch(TAG_DATA_URL);
    if (response.ok) {
      const data = await response.json();
      return data;
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
    tagPaths: [], // Store full tag paths for API lookup
  };

  // Check if first row has 2 columns (author mode with key-value)
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
        }
      }
    });
  } else {
    // Publish mode: first 2 rows are config values
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
  }

  return config;
}

export default async function decorate(block) {
  // Read configuration
  const config = readTagConfig(block);
  const { title, tagPaths } = config;

  // Fetch tag data from API
  const tagData = await fetchTagData();

  // Main container
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
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-item';
      // Get tag title from API data
      tagEl.textContent = getTagTitle(tagPath, tagData);
      tagList.appendChild(tagEl);
    });

    container.appendChild(tagList);
  }

  block.replaceChildren(container);
  block.classList.add('loaded');
}
