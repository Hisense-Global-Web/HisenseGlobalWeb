import { isUniversalEditorAsync } from '../../utils/ue-helper.js';
import { getLocaleFromPath } from '../../scripts/locale-utils.js';

const isEditing = await isUniversalEditorAsync();
const { country } = getLocaleFromPath();

const REGION_API = isEditing ? '/bin/hisense/region-selection.json' : '/api/hisense/region-selection.json';
const ARROW_ICON = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;

const bindEvent = (block) => {
  const regions = block.querySelectorAll('.region');
  if (!regions.length) return;

  regions.forEach((region) => {
    const titleWrapper = region.querySelector('.region-title-wrapper');
    const regionList = region.querySelector('.region-list');
    const arrow = region.querySelector('.region-title-arrow');

    if (!titleWrapper || !regionList) return;

    const handleTitleClick = () => {
      const isMobile = window.innerWidth < 860;
      if (!isMobile) return;

      const isExpanded = region.classList.contains('expanded');

      if (isExpanded) {
        region.classList.remove('expanded');
        regionList.style.maxHeight = '0';
        regionList.style.overflow = 'hidden';

        if (arrow) {
          arrow.style.transform = 'rotate(180deg)';
        }
      } else {
        region.classList.add('expanded');
        regionList.style.maxHeight = 'none';
        regionList.style.overflow = 'visible';

        if (arrow) {
          arrow.style.transform = 'rotate(0deg)';
        }
      }
    };

    titleWrapper.addEventListener('click', handleTitleClick);

    titleWrapper.addEventListener('touchstart', (event) => {
      event.preventDefault();
      handleTitleClick();
    });
  });

  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 860;

    regions.forEach((region) => {
      const regionList = region.querySelector('.region-list');
      const arrow = region.querySelector('.region-title-arrow');

      if (!regionList) return;

      if (!isMobile) {
        region.classList.add('expanded');
        regionList.style.maxHeight = 'none';
        regionList.style.overflow = 'visible';

        if (arrow) {
          arrow.style.transform = 'rotate(180deg)';
        }
      } else if (!region.classList.contains('expanded')) {
        regionList.style.maxHeight = '0';
        regionList.style.overflow = 'hidden';

        if (arrow) {
          arrow.style.transform = 'rotate(0deg)';
        }
      }
    });
  });

  regions.forEach((region) => {
    const regionList = region.querySelector('.region-list');
    const arrow = region.querySelector('.region-title-arrow');

    if (!regionList) return;

    if (window.innerWidth < 860) {
      region.classList.remove('expanded');
      regionList.style.maxHeight = '0';
      regionList.style.overflow = 'hidden';
      regionList.style.transition = 'max-height 0.3s ease';
    } else {
      region.classList.add('expanded');
      regionList.style.maxHeight = 'none';
      regionList.style.overflow = 'visible';

      if (arrow) {
        arrow.style.transform = 'rotate(180deg)';
      }
    }
  });
};

const fetchRegionData = async () => {
  const response = await fetch(REGION_API);

  if (!response.ok) {
    throw new Error(`Failed to load region data: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.regions) ? data.regions : [];
};

const createRegionElement = (region) => {
  const regionElement = document.createElement('div');
  regionElement.classList.add('region');

  const titleWrapper = document.createElement('div');
  titleWrapper.classList.add('region-title-wrapper');

  const title = document.createElement('p');
  title.classList.add('region-title');
  title.textContent = region?.name || '';

  const arrow = document.createElement('img');
  arrow.classList.add('region-title-arrow');
  arrow.src = ARROW_ICON;
  arrow.alt = '';

  titleWrapper.append(title, arrow);

  const list = document.createElement('ul');
  list.classList.add('region-list');

  const countries = Array.isArray(region?.countries) ? region.countries : [];
  let hasAnyLanguage = false;

  countries.forEach((countryItem) => {
    const languages = Array.isArray(countryItem?.languages) ? countryItem.languages : [];
    const countryCode = countryItem?.code || '';
    const countryName = countryItem?.name || countryCode;

    if (!languages.length) {
      return;
    }

    languages.forEach((language) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      const span = document.createElement('span');

      const languageCode = language?.code || '';

      link.href = `/${countryCode}/${languageCode}`;
      span.lang = languageCode;
      span.textContent = `${countryName} (${language?.name || ''})`;

      link.append(span);
      li.append(link);
      list.append(li);
      hasAnyLanguage = true;
    });
  });

  if (!hasAnyLanguage) {
    return null;
  }

  regionElement.append(titleWrapper, list);
  return regionElement;
};

export default async function decorate(block) {
  const div = block.querySelectorAll(':scope > div');
  const blockData = {
    title: div[0]?.textContent.trim(),
  };

  const wrapper = document.createElement('div');
  wrapper.classList.add('container');

  const title = document.createElement('h1');
  title.classList.add('region-selection-title');
  title.textContent = blockData.title || '';

  const titleWrapper = document.createElement('div');
  titleWrapper.classList.add('region-selection-title-wrapper');
  titleWrapper.append(title);

  // add title element
  const blockParent = block.parentElement;
  const blockGrandparent = blockParent?.parentElement;

  if (blockParent && blockGrandparent) {
    const previousSibling = blockParent.previousElementSibling;
    if (previousSibling?.classList.contains('region-selection-title-wrapper')) {
      previousSibling.remove();
    }
    blockGrandparent.insertBefore(titleWrapper, blockParent);
  } else if (blockParent) {
    const previousSibling = block.previousElementSibling;
    if (previousSibling?.classList.contains('region-selection-title-wrapper')) {
      previousSibling.remove();
    }
    blockParent.insertBefore(titleWrapper, block);
  }

  block.innerHTML = '';
  block.append(wrapper);

  try {
    const regions = await fetchRegionData();
    regions.forEach((region) => {
      const regionElement = createRegionElement(region);
      if (regionElement) {
        wrapper.append(regionElement);
      }
    });
  } catch (error) {
    // Keep title visible even when API fails.
    // eslint-disable-next-line no-console
    console.warn('Failed to render region selection list', error);
  }

  bindEvent(block);
}
