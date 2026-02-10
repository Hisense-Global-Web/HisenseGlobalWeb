/**
 * Read block configuration for key-value mode
 */
function readTagConfig(block) {
  const rows = [...block.children];
  const config = {
    title: '',
    tags: [],
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
            // Extract tag names from links
            config.tags = [...links].map((link) => {
              const tagPath = link.textContent.trim();
              // Extract last part of tag path (e.g., "hisense:download/fifa" -> "fifa")
              return tagPath.split(':').pop().split('/').pop();
            });
          } else {
            // Fallback: comma-separated text
            const text = valueCell.textContent.trim();
            config.tags = text.split(',').map((tag) => tag.trim()).filter(Boolean);
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
        config.tags = [...links].map((link) => {
          const tagPath = link.textContent.trim();
          // Extract last part of tag path (e.g., "hisense:download/fifa" -> "fifa")
          return tagPath.split(':').pop().split('/').pop();
        });
      } else {
        const text = rows[1].textContent.trim();
        config.tags = text.split(',').map((tag) => tag.trim()).filter(Boolean);
      }
    }
  }

  return config;
}

export default function decorate(block) {
  // Read configuration
  const config = readTagConfig(block);
  const { title, tags } = config;

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
  if (tags && tags.length > 0) {
    const tagList = document.createElement('div');
    tagList.className = 'tag-list';

    tags.forEach((tagText) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-item';
      tagEl.textContent = tagText;
      tagList.appendChild(tagEl);
    });

    container.appendChild(tagList);
  }

  block.replaceChildren(container);
  block.classList.add('loaded');
}
