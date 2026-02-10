import { readBlockConfig, decorateIcons } from '../../scripts/aem.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);

  const searchLink = config['search-link'] || '/search';
  const placeholder = config.placeholder || 'Search';
  const target = config.target || '_self';

  const wrapper = document.createElement('div');
  wrapper.className = 'search-box-wrapper';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'icon icon-search';
  wrapper.appendChild(iconSpan);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.className = 'search-box-input';
  input.setAttribute('aria-label', placeholder);
  wrapper.appendChild(input);

  const clearBtn = document.createElement('button');
  clearBtn.className = 'search-box-clear';
  clearBtn.setAttribute('aria-label', 'Clear search');
  clearBtn.type = 'button';
  clearBtn.textContent = '\u00D7';
  wrapper.appendChild(clearBtn);

  input.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', input.value.length > 0);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const url = `${searchLink}?fulltext=${encodeURIComponent(input.value.trim())}`;
      if (target === '_blank') {
        window.open(url, '_blank', 'noopener');
      } else {
        window.location.href = url;
      }
    }
  });

  block.replaceChildren(wrapper);
  decorateIcons(block);
  block.classList.add('loaded');
}
