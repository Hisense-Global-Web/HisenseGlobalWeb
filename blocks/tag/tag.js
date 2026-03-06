import { getLocalizedTagTitle } from '../../scripts/tag-utils.js';

const DEFAULT_TAGS_ENDPOINT = '/content/cq:tags/hisense.-1.json';

function getTagsEndpointUrl() {
  const baseUrl = window.GRAPHQL_BASE_URL || '';
  const path = DEFAULT_TAGS_ENDPOINT;
  return baseUrl ? `${baseUrl}${path}` : path;
}

/**
 * Fetch tag data from API
 */
async function fetchTagData() {
  try {
    const response = await fetch(getTagsEndpointUrl());
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
 * Read block configuration for key-value mode
 */
function readTagConfig(block) {
  const rows = [...block.children];
  const config = {
    title: '',
    tagPaths: [], // Store full tag paths for API lookup
    link: '',
    target: '_self',
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
  const resource = block.dataset.aueResource;
  if (resource && block.parentNode) {
    [...block.parentNode.querySelectorAll('.tag.block')]
      .filter((el) => el !== block && el.dataset.aueResource === resource)
      .forEach((el) => el.remove());
  }

  const config = readTagConfig(block);
  const {
    title, tagPaths, link, target,
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
        tagEl.textContent = getLocalizedTagTitle(tagPath, tagData);
        tagList.appendChild(tagEl);
      } else {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item';
        tagEl.textContent = getLocalizedTagTitle(tagPath, tagData);
        tagList.appendChild(tagEl);
      }
    });

    container.appendChild(tagList);
  }

  block.replaceChildren(container);
  block.classList.add('loaded');
}
