import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');

  const rows = [...block.children];
  const fragment = document.createDocumentFragment();
  let tagCounter = 0;
  const tagsEndpoint = '/content/dam/hisense/us/tag-data/en/tag-data.json';
  const mockTags = {
    total: 1,
    offset: 0,
    limit: 1,
    columns: [
      'jcr:description',
      'jcr:title',
      'tv',
    ],
    data: [
      {
        'jcr:description': '',
        'jcr:title': 'Product',
        tv: {
          'jcr:title': 'TV',
          'jcr:description': '',
          resolution: {
            'jcr:title': 'Resolution',
            hd: {
              'jcr:description': '',
              'jcr:title': 'HD',
            },
            fhd: {
              'jcr:description': '',
              'jcr:title': 'FHD',
            },
            uhd: {
              'jcr:description': '',
              'jcr:title': 'UHD',
            },
          },
          'refresh-rate': {
            'jcr:description': '',
            'jcr:title': 'Refresh Rate',
            '60hz': {
              'jcr:description': '',
              'jcr:title': '60Hz',
            },
            '144hz': {
              'jcr:description': '',
              'jcr:title': '144Hz',
            },
            '165hz': {
              'jcr:description': '',
              'jcr:title': '165Hz',
            },
            '170hz': {
              'jcr:description': '',
              'jcr:title': '170Hz',
            },
            '180hz': {
              'jcr:description': '',
              'jcr:title': '180Hz',
            },
          },
          'screen-size': {
            'jcr:title': 'Screen Size (Range)',
            '32-43': {
              'jcr:description': '',
              'jcr:title': '32” - 43” ',
            },
            '50-65': {
              'jcr:description': '',
              'jcr:title': '50” - 65” ',
            },
            '70-85': {
              'jcr:description': '',
              'jcr:title': '70” - 85” ',
            },
            '98-max': {
              'jcr:description': '',
              'jcr:title': '98” and above ',
            },
          },
          type: {
            'jcr:description': '',
            'jcr:title': 'Type',
            'rgb-miniled': {
              'jcr:description': '',
              'jcr:title': 'RGB MiniLED',
            },
            miniled: {
              'jcr:description': '',
              'jcr:title': 'MiniLED',
            },
            'hi-qled': {
              'jcr:description': '',
              'jcr:title': 'Hi-QLED',
            },
            oled: {
              'jcr:description': '',
              'jcr:title': 'OLED',
            },
            'lcd-led': {
              'jcr:description': 'LCD LED\r\nFull Array',
              'jcr:title': 'LCD LED',
            },
            'uhd-4k': {
              'jcr:title': 'UHD 4K',
              'jcr:description': 'UHD 4K',
            },
          },
          'operating-system': {
            'jcr:title': 'Operating System',
            'fire-tv': {
              'jcr:description': '',
              'jcr:title': 'Fire TV',
            },
            'google-tv': {
              'jcr:description': '',
              'jcr:title': 'Google TV',
            },
            'roku-tv': {
              'jcr:description': '',
              'jcr:title': 'Roku TV',
            },
            'vidda-tv ': {
              'jcr:description': '',
              'jcr:title': 'VIDDA TV ',
            },
          },
          audio: {
            'jcr:description': '',
            'jcr:title': 'Audio',
            dolby: {
              'jcr:description': '',
              'jcr:title': 'Dolby',
            },
          },
        },
      },
    ],
    ':type': 'sheet',
  };

  function collectTitles(obj, map) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      if (k.startsWith('jcr:') || k === 'sling:resourceType' || k === 'jcr:primaryType') return;
      const v = obj[k];
      if (v && typeof v === 'object') {
        const trimmedKey = k.trim();
        if (v['jcr:title']) map[trimmedKey] = v['jcr:title'];
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
        const lastPart = (parts[parts.length - 1] || tagPath).trim();
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
          childIndex += 1;
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
    // mobile 端， 为 filter 添加标题
    const filterTagWrapperEl = document.querySelector('.plp-product-filter-tag-wrapper');
    const filterTagEl = document.querySelector('.plp-product-filter-tag');
    if (filterTagEl) {
      const titleBoxEl = document.createElement('div');
      titleBoxEl.className = 'plp-mobile-filters-tit-box';
      const mobileProdctTagTit = document.createElement('div');
      mobileProdctTagTit.className = 'mobile-filter-title';
      const mobileFiltersSpan = document.createElement('span');
      mobileFiltersSpan.textContent = 'Filters';
      const mobileFiltersImg = document.createElement('img');
      mobileFiltersImg.src = '/content/dam/hisense/image/icon/mobile-filters-title.svg';
      mobileFiltersImg.alt = 'Filters title';
      mobileProdctTagTit.append(mobileFiltersImg, mobileFiltersSpan);

      const closeBtn = document.createElement('div');
      closeBtn.className = 'mobile-filter-close';
      const closeImg = document.createElement('img');
      closeImg.src = './media_13b817dae786f9278b5ba58ce39c250a3c305d1d7.svg?width=750&format=svg&optimize=medium';
      closeImg.alt = 'mobile-filter';
      closeBtn.addEventListener('click', () => {
        filterTagWrapperEl.classList.remove('mobile-filter-show');
        document.body.style.overflow = 'auto';
      });
      closeBtn.append(closeImg);
      titleBoxEl.append(mobileProdctTagTit, closeBtn);
      filterTagEl.prepend(titleBoxEl);
    }
  }

  fetch(tagsEndpoint)
    .then((resp) => {
      if (!resp.ok) throw new Error('Network response not ok');
      return resp.json();
    })
    .then((data) => {
      let tagsData = data;
      if (data && data.tags) {
        tagsData = data.tags;
      } else if (data && data.data && Array.isArray(data.data)) {
        tagsData = data.data[0] || data;
      }
      renderWithTitles(tagsData || mockTags);
    })
    .catch(() => {
      renderWithTitles(mockTags);
    });
}
