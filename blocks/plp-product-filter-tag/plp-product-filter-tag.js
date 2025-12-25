import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');

  const rows = [...block.children];
  const fragment = document.createDocumentFragment();
  let tagCounter = 0;
  const tagsEndpoint = '/content/cq:tags/hisense/product.-1.json';
  const mockTags = {
    'jcr:description': '',
    'jcr:created': 'Wed Dec 17 2025 19:04:27 GMT+0000',
    'sling:resourceType': 'cq/tagging/components/tag',
    'jcr:primaryType': 'cq:Tag',
    'jcr:title': 'Product',
    tv: {
      'jcr:lastModified': 'Wed Dec 17 2025 19:04:39 GMT+0000',
      'jcr:created': 'Thu Dec 11 2025 07:17:50 GMT+0000',
      'jcr:title': 'TV',
      'sling:resourceType': 'cq/tagging/components/tag',
      'jcr:primaryType': 'cq:Tag',
      'jcr:description': '',
      resolution: {
        'jcr:title.en': 'Resolution',
        'jcr:title.fr': 'Résolution',
        'jcr:lastModified': 'Thu Dec 11 2025 07:37:44 GMT+0000',
        'jcr:created': 'Thu Dec 11 2025 07:18:58 GMT+0000',
        'jcr:title': 'Resolution',
        'sling:resourceType': 'cq/tagging/components/tag',
        'jcr:primaryType': 'cq:Tag',
        hd: {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:19:25 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'HD',
        },
        fhd: {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:19:41 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'FHD',
        },
        uhd: {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:19:53 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'UHD',
        },
      },
      'refresh-rate': {
        'jcr:description': '',
        'jcr:created': 'Thu Dec 11 2025 07:20:40 GMT+0000',
        'sling:resourceType': 'cq/tagging/components/tag',
        'jcr:primaryType': 'cq:Tag',
        'jcr:title': 'Refresh Rate',
        '60hz': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:21:04 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '60Hz',
        },
        '144hz': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:21:21 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '144Hz',
        },
        '165hz': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:21:39 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '165Hz',
        },
        '170hz': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:21:57 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '170Hz',
        },
        '180hz': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:22:11 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '180Hz',
        },
      },
      'screen-size': {
        'jcr:lastModified': 'Thu Dec 11 2025 07:34:03 GMT+0000',
        'jcr:primaryType': 'cq:Tag',
        'jcr:title': 'Screen Size (Range)',
        'sling:resourceType': 'cq/tagging/components/tag',
        'jcr:created': 'Thu Dec 11 2025 07:22:30 GMT+0000',
        '32-43': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:23:03 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '32” - 43” ',
        },
        '50-65': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:23:38 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '50” - 65” ',
        },
        '70-85': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:23:56 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '70” - 85” ',
        },
        '98-max': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:24:43 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '98” and above ',
        },
        43: {
          'jcr:lastModified': 'Fri Dec 19 2025 08:31:54 GMT+0000',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '43"',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:created': 'Fri Dec 19 2025 08:31:39 GMT+0000',
        },
        50: {
          'jcr:lastModified': 'Fri Dec 19 2025 08:33:24 GMT+0000',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '50"',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:created': 'Fri Dec 19 2025 08:32:16 GMT+0000',
        },
        55: {
          'jcr:lastModified': 'Fri Dec 19 2025 08:33:40 GMT+0000',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '55"',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:created': 'Fri Dec 19 2025 08:32:31 GMT+0000',
        },
        65: {
          'jcr:lastModified': 'Fri Dec 19 2025 08:33:58 GMT+0000',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '65"',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:created': 'Fri Dec 19 2025 08:32:46 GMT+0000',
        },
        75: {
          'jcr:lastModified': 'Fri Dec 19 2025 08:34:10 GMT+0000',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': '75"',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:created': 'Fri Dec 19 2025 08:32:56 GMT+0000',
        },
      },
      type: {
        'jcr:description': '',
        'jcr:created': 'Thu Dec 11 2025 07:26:19 GMT+0000',
        'sling:resourceType': 'cq/tagging/components/tag',
        'jcr:primaryType': 'cq:Tag',
        'jcr:title': 'Type',
        'rgb-miniled': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:26:38 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'RGB MiniLED',
        },
        miniled: {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:27:00 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'MiniLED',
        },
        'hi-qled': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:27:16 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'Hi-QLED',
        },
        oled: {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:27:53 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'OLED',
        },
        'uhd-4k': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:28:06 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'UHD 4K',
        },
        'lcd-led': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:28:20 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'LCD LED',
        },
      },
      'operating-system': {
        'jcr:lastModified': 'Thu Dec 11 2025 07:30:10 GMT+0000',
        'jcr:primaryType': 'cq:Tag',
        'jcr:title': 'Operating System',
        'sling:resourceType': 'cq/tagging/components/tag',
        'jcr:created': 'Thu Dec 11 2025 07:28:36 GMT+0000',
        'fire-tv': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:28:52 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'Fire TV',
        },
        'google-tv': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:29:19 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'Google TV',
        },
        'roku-tv': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:29:44 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'Roku TV',
        },
        'vidda-tv ': {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 07:29:55 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'VIDDA TV ',
        },
      },
      audio: {
        'jcr:description': '',
        'jcr:created': 'Thu Dec 11 2025 08:04:38 GMT+0000',
        'sling:resourceType': 'cq/tagging/components/tag',
        'jcr:primaryType': 'cq:Tag',
        'jcr:title': 'Audio',
        dolby: {
          'jcr:description': '',
          'jcr:created': 'Thu Dec 11 2025 08:05:16 GMT+0000',
          'sling:resourceType': 'cq/tagging/components/tag',
          'jcr:primaryType': 'cq:Tag',
          'jcr:title': 'Dolby',
        },
      },
    },
  };

  function collectTitles(obj, map) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      if (k.startsWith('jcr:') || k === 'sling:resourceType' || k === 'jcr:primaryType') return;
      const v = obj[k];
      if (v && typeof v === 'object') {
        if (v['jcr:title']) map[k] = v['jcr:title'];
        collectTitles(v, map);
      }
    });
  }

  function renderWithTitles(tagsData) {
    const titlesMap = {};
    collectTitles(tagsData, titlesMap);

    function getActiveFiltersContainer() {
      return document.querySelector('.plp-active-filters');
    }

    function createActiveFilterElement(tagPath, labelText, inputId) {
      const tag = document.createElement('div');
      tag.className = 'plp-filter-tag';
      tag.setAttribute('data-option-value', tagPath);
      if (inputId) tag.setAttribute('data-source-id', inputId);

      const textSpan = document.createElement('span');
      textSpan.textContent = labelText;
      const closeSpan = document.createElement('span');
      closeSpan.className = 'plp-filter-tag-close';
      closeSpan.textContent = '×';

      closeSpan.addEventListener('click', () => {
        const srcId = tag.getAttribute('data-source-id');
        if (srcId) {
          const src = document.getElementById(srcId);
          if (src && src.checked) {
            src.checked = false;
            src.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        tag.remove();
      });

      tag.append(textSpan, closeSpan);
      return tag;
    }

    function addActiveFilterIfMissing(tagPath, labelText, inputId) {
      const container = getActiveFiltersContainer();
      if (!container) return;
      const existing = container.querySelector(`.plp-filter-tag[data-option-value="${CSS.escape(tagPath)}"]`);
      if (!existing) {
        const el = createActiveFilterElement(tagPath, labelText, inputId);
        container.append(el);
      }
    }

    function removeActiveFilter(tagPath) {
      const container = getActiveFiltersContainer();
      if (!container) return;
      const existing = container.querySelector(`.plp-filter-tag[data-option-value="${CSS.escape(tagPath)}"]`);
      if (existing) existing.remove();
    }

    rows.forEach((row) => {
      const resource = row.getAttribute('data-aue-resource') || null;
      const cells = [...row.children];
      if (cells.length < 2) return;

      const titleText = cells[0].textContent.trim();
      const tagsCsv = cells[1].textContent.trim();
      if (!titleText || !tagsCsv) return;

      const group = document.createElement('div');
      group.className = 'plp-filter-group';
      if (isEditMode && resource) {
        group.setAttribute('data-aue-resource', resource);
      }
      moveInstrumentation(row, group);

      const title = document.createElement('div');
      title.className = 'plp-filter-title';
      const titleSpan = document.createElement('span');
      titleSpan.textContent = titleText;
      const arrow = document.createElement('img');
      arrow.src = './media_18b1fbb6305019af784f87587d3bfbc78f2ca3575.svg?width=750&format=svg&optimize=medium';
      arrow.addEventListener('click', (e) => {
        const grandParent = e.target.parentNode?.parentNode;
        if (!grandParent) { return; }
        grandParent.classList.toggle('hide');
      });
      title.append(titleSpan, arrow);

      const list = document.createElement('ul');
      list.className = 'plp-filter-list';

      const tags = tagsCsv.split(',').map((t) => t.trim()).filter(Boolean);
      tags.forEach((tagPath) => {
        const li = document.createElement('li');
        li.className = 'plp-filter-item';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = tagPath;
        input.setAttribute('data-option-value', tagPath);
        input.id = `plp-filter-${tagCounter}`;
        tagCounter += 1;

        const label = document.createElement('label');
        label.htmlFor = input.id;
        const parts = tagPath.split('/');
        const lastPart = parts[parts.length - 1] || tagPath;
        const matchedTitle = titlesMap[lastPart];
        label.textContent = (matchedTitle && String(matchedTitle).trim()) ? matchedTitle : lastPart;

        li.append(input, label);
        list.append(li);

        input.addEventListener('change', () => {
          const labelText = label.textContent || lastPart;
          if (input.checked) {
            addActiveFilterIfMissing(tagPath, labelText, input.id);
          } else {
            removeActiveFilter(tagPath);
          }
          if (window && typeof window.applyPlpFilters === 'function') {
            window.applyPlpFilters();
          }
        });
      });

      group.append(title, list);
      fragment.append(group);
    });

    if (isEditMode) {
      const asideElements = [];
      const fragmentChildren = [...fragment.children];
      let childIndex = 0;

      rows.forEach((row) => {
        const aside = document.createElement('aside');
        aside.className = 'plp-sidebar';

        [...row.attributes].forEach((attr) => {
          if (attr.name.startsWith('data-aue-')) {
            aside.setAttribute(attr.name, attr.value);
          }
        });

        if (childIndex < fragmentChildren.length) {
          aside.append(fragmentChildren[childIndex]);
          // eslint-disable-next-line no-plusplus
          childIndex++;
        }

        asideElements.push(aside);
      });

      block.replaceChildren(...asideElements);
    } else {
      const sidebar = document.createElement('aside');
      sidebar.className = 'plp-sidebar';
      sidebar.append(fragment);
      block.replaceChildren(sidebar);
    }
  }

  fetch(tagsEndpoint)
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      renderWithTitles(data || mockTags);
    })
    .catch(() => {
      renderWithTitles(mockTags);
    });
}
