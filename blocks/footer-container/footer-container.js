import { getLocaleFromPath, languageList } from '../../scripts/locale-utils.js';
import { processPath } from '../../utils/carousel-common.js';
import { createDynamicMediaPicture } from '../hero-banner/media-reference.js';
import translate from '../../utils/translate.js';

const { country, language } = getLocaleFromPath();
const REGION = '/hisense/region-selection.json';

// 简单哈希函数，用于缓存破坏
function simpleHash(str) {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h).toString(36);
}

// 获取标签数据
async function fetchRegionData(url) {
  try {
    const response = await fetch(url);
    if (response.ok) return response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('search-result-module: failed to fetch tag data:', error);
  }
  return null;
}

function normalizeLanguages(languages) {
  if (languages && typeof languages === 'object' && !Array.isArray(languages)) {
    return languages;
  }

  if (!Array.isArray(languages)) {
    return {};
  }

  return languages.reduce((accumulator, entry) => {
    const code = String(entry?.code || '').trim();
    if (!code) {
      return accumulator;
    }

    accumulator[code] = String(entry?.name || code).trim();
    return accumulator;
  }, {});
}

function resolveRegionCountryData(regionData) {
  const directCountry = regionData?.country;
  if (directCountry) {
    const languages = normalizeLanguages(directCountry.languages);
    const languageKeys = Object.keys(languages);
    const selectedLanguage = directCountry.selectedLanguage
      || (languageKeys.includes(language) ? language : '')
      || directCountry.defaultLanguage
      || languageKeys[0]
      || language;

    return {
      code: String(directCountry.code || country).trim(),
      name: String(directCountry.name || country.toUpperCase()).trim(),
      languages,
      selectedLanguage,
    };
  }

  const regions = Array.isArray(regionData?.regions) ? regionData.regions : [];
  const countryEntry = regions
    .flatMap((region) => (Array.isArray(region?.countries) ? region.countries : []))
    .find((entry) => String(entry?.code || '').toLowerCase() === country);

  if (!countryEntry) {
    return null;
  }

  const languages = normalizeLanguages(countryEntry.languages);
  const languageKeys = Object.keys(languages);
  const selectedLanguage = (languageKeys.includes(language) ? language : '')
    || countryEntry.defaultLanguage
    || languageKeys[0]
    || language;

  return {
    code: String(countryEntry.code || country).trim(),
    name: String(countryEntry.name || country.toUpperCase()).trim(),
    languages,
    selectedLanguage,
  };
}

function buildLocalizedFooterPath(pathname = window.location.pathname) {
  const rawPath = String(pathname || '').trim();
  const pathSegments = rawPath.split('/').filter(Boolean);

  if (!pathSegments.length) {
    return `/${country}/${language}`;
  }

  const isContentPath = pathSegments[0] === 'content';
  if (isContentPath) {
    const normalizedSegments = [...pathSegments];
    normalizedSegments[2] = country;
    normalizedSegments[3] = language;
    return `/${normalizedSegments.filter(Boolean).join('/')}`;
  }

  if (pathSegments[0] !== country) {
    return `/${country}/${language}${rawPath.startsWith('/') ? rawPath : `/${rawPath}`}`;
  }

  const normalizedSegments = [...pathSegments];
  if (normalizedSegments[1] !== language) {
    normalizedSegments.splice(1, 0, language);
  }

  return `/${normalizedSegments.join('/')}`;
}

function buildLocalizedPathForLanguage(nextLanguage) {
  const normalizedSegments = buildLocalizedFooterPath().split('/').filter(Boolean);
  const isContentPath = normalizedSegments[0] === 'content';
  const languageIndex = isContentPath ? 3 : 1;
  normalizedSegments[languageIndex] = nextLanguage;
  return `/${normalizedSegments.join('/')}${window.location.search}`;
}

function buildRegionSelectionPath(selectedLanguage) {
  return `/${country}/${selectedLanguage}/select-your-region`;
}

function isInternalLink(href) {
  if (!href || href === '#' || href === '/') {
    return true;
  }

  if (href.startsWith('/')) {
    return true;
  }

  if (!href.includes('://')) {
    return true;
  }

  try {
    const linkUrl = new URL(href);
    const currentUrl = new URL(window.location.href);
    return linkUrl.hostname === currentUrl.hostname;
  } catch (e) {
    return true;
  }
}

function extractLogoData(container) {
  const logoData = {
    image: null,
    alt: '',
    link: '/',
    social: [],
  };

  const logoBlock = container.querySelector('.footer-logo');
  if (!logoBlock) {
    return logoData;
  }

  const logoDivs = Array.from(logoBlock.children).filter((child) => child.tagName === 'DIV');

  let step = 0;
  if (logoDivs.length > 0) {
    let firstDiv = logoDivs[0];
    if (firstDiv.textContent.trim() === 'true' || firstDiv.textContent.trim() === 'false') {
      step = 1;
      // eslint-disable-next-line prefer-destructuring
      firstDiv = logoDivs[step];
    }
    const innerDiv = firstDiv.querySelector('div');
    if (innerDiv) {
      const logoPicture = innerDiv.querySelector('picture');
      if (logoPicture) {
        const logoImg = logoPicture.querySelector('img');
        if (logoImg) {
          logoData.image = true ? createDynamicMediaPicture(logoImg.src, logoImg.alt) : logoImg.cloneNode(true);
        }
      } else {
        const logoImg = innerDiv.querySelector('img');
        if (logoImg) {
          logoData.image = true ? createDynamicMediaPicture(logoImg.src, logoImg.alt) : logoImg.cloneNode(true);
        } else {
          const aImg = innerDiv.querySelector('a');
          logoData.image = createDynamicMediaPicture(aImg.href);
        }
      }
    }
  }

  if (logoDivs.length > 1 + step) {
    const altDiv = logoDivs[1 + step];
    const innerDiv = altDiv.querySelector('div');
    if (innerDiv) {
      const altP = innerDiv.querySelector('p');
      if (altP) {
        logoData.alt = altP.textContent.trim();
      }
    }
  }

  if (logoDivs.length > 2 + step) {
    const linkDiv = logoDivs[2 + step];
    const innerDiv = linkDiv.querySelector('div');
    if (innerDiv) {
      const buttonContainer = innerDiv.querySelector('p.button-container');
      if (buttonContainer) {
        const link = buttonContainer.querySelector('a');
        if (link) {
          logoData.link = link.href || link.getAttribute('href');
        }
      }
    }
  }

  logoDivs.forEach((div, index) => {
    if (index < 3 + step) {
      return;
    }

    const innerDiv = div.querySelector('div');
    if (!innerDiv) {
      return;
    }

    const socialImg = innerDiv.querySelector('img');
    const imgBox = document.createElement('div');
    imgBox.className = 'footer-social-imgbox';
    imgBox.setAttribute('data-index', `${index - 3 - step}`);
    socialImg.className = 'footer-social-width';
    const socialLink = div.children[1].querySelector('a');
    const showPopup = div.children[2];
    if (socialImg) {
      imgBox.appendChild(socialImg);
      if (showPopup?.textContent?.trim() === 'true') {
        let footerSocialPopup = document.querySelector('#footer-social');
        if (!footerSocialPopup) {
          footerSocialPopup = document.createElement('div');
          footerSocialPopup.id = 'footer-social';
          document.querySelector('body').appendChild(footerSocialPopup);
        }
        let footerSocialMask = document.querySelector('#footer-social-mask');
        if (!footerSocialMask) {
          footerSocialMask = document.createElement('div');
          footerSocialMask.id = 'footer-social-mask';
          document.querySelector('body').appendChild(footerSocialMask);
        }
        const popupCloseImg = document.createElement('img');
        popupCloseImg.src = `/content/dam/hisense/${country}/common-icons/close.svg`;
        popupCloseImg.className = 'close-icon';
        popupCloseImg.addEventListener('click', (e) => {
          e.stopPropagation();
          footerSocialPopup.style.display = 'none';
          footerSocialMask.style.display = '';
        });
        const titleEl = document.createElement('div');
        titleEl.className = 'footer-popup-title';
        titleEl.textContent = div.children[3].textContent.trim();
        const subtitleEl = document.createElement('div');
        subtitleEl.className = 'footer-popup-subtitle';
        subtitleEl.textContent = div.children[4].textContent.trim();
        const imgEl = document.createElement('img');
        imgEl.className = 'footer-popup-img';
        imgEl.src = div.children[5].querySelector('img').src;

        const divEl = document.createElement('div');
        divEl.append(popupCloseImg, titleEl, subtitleEl, imgEl);
        divEl.setAttribute('index', `${index - 3 - step}`);
        footerSocialPopup.append(divEl);
        imgBox.addEventListener('click', (e) => {
          e.stopPropagation();
          footerSocialPopup.style.display = 'flex';
          const childDivs = footerSocialPopup.querySelectorAll(':scope > div');
          const targetIndex = e.currentTarget.getAttribute('data-index');
          childDivs.forEach((child) => {
            const childIndex = child.getAttribute('index');
            child.style.display = (childIndex === targetIndex) ? '' : 'none';
          });
          footerSocialMask.style.display = 'block';
        });
      } else if (socialLink) {
        imgBox.appendChild(socialLink);
      }
      logoData.social.push(imgBox);
    }
  });
  return logoData;
}

function buildSearchTagParams(tagsText) {
  return String(tagsText || '')
    .split(',')
    .map((tag) => {
      const parts = tag.trim().split('/');
      if (parts.length >= 2) {
        const key = parts[parts.length - 2];
        const value = parts[parts.length - 1];
        return `${key}=${value}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('&');
}

function extractNavColumnsData(container) {
  const navColumns = [];

  const columnBlocks = container.querySelectorAll('.footer-nav-column');
  columnBlocks.forEach((columnBlock) => {
    const columnData = {
      title: '',
      items: [],
    };

    const columnDivs = Array.from(columnBlock.children).filter((child) => child.tagName === 'DIV');
    if (columnDivs.length > 0) {
      const firstDiv = columnDivs[0];
      const titleP = firstDiv.querySelector('p');
      if (titleP) {
        columnData.title = titleP.textContent.trim();
      }
    }

    columnDivs.forEach((div, index) => {
      if (index === 0) {
        return;
      }

      const itemData = {
        text: '',
        link: '#',
      };

      const childDivs = Array.from(div.children).filter((child) => child.tagName === 'DIV');
      if (childDivs.length > 0) {
        const textDiv = childDivs[0];
        const p = textDiv.querySelector('p');
        if (p && !p.classList.contains('button-container')) {
          itemData.text = p.textContent.trim();
        }
      }

      if (childDivs.length > 1) {
        const linkDiv = childDivs[1];
        const link = linkDiv.querySelector('a');
        if (link) {
          itemData.link = link.getAttribute('href') || '#';
        }
        if (childDivs.length > 2 && itemData.link !== '#' && itemData.link?.indexOf('?') === -1) {
          itemData.link += `?${buildSearchTagParams(childDivs[2].textContent.trim())}`;
        }
        if (itemData.link && itemData.link.endsWith('?')) {
          itemData.link = itemData.link.slice(0, -1);
        }
      }

      if (itemData.text) {
        columnData.items.push(itemData);
      }
    });

    if (columnData.title || columnData.items.length > 0) {
      navColumns.push(columnData);
    }
  });

  return navColumns;
}

function extractLegalLinksData(container) {
  const legalLinksData = {
    links: [],
    copyright: '',
    icon1: '',
    icon2: '',
  };

  const legalLinksBlock = container.querySelector('.footer-legal-links');
  if (!legalLinksBlock) {
    return legalLinksData;
  }

  const legalItemRows = Array.from(legalLinksBlock.children).filter((child) => child.tagName === 'DIV');

  legalItemRows.forEach((row, index) => {
    if (index === 0) {
      legalLinksData.copyright = row.textContent.trim();
      return;
    }

    if (index === 1 && row.querySelector('img')) {
      legalLinksData.icon1 = row.querySelector('img').src;
      return;
    }

    if (index === 2 && row.querySelector('img')) {
      legalLinksData.icon2 = row.querySelector('img').src;
      return;
    }

    const linkData = {
      text: '',
      link: '#',
    };

    const linkColumns = Array.from(row.children).filter((child) => child.tagName === 'DIV');
    if (linkColumns.length > 0) {
      const linkLabelColumn = linkColumns[0];
      const labelParagraph = linkLabelColumn.querySelector('p');
      if (labelParagraph && !labelParagraph.classList.contains('button-container')) {
        linkData.text = labelParagraph.textContent.trim();
      } else if (!labelParagraph && linkLabelColumn.textContent.trim()) {
        linkData.text = linkLabelColumn.textContent.trim();
      }
    }

    if (linkColumns.length > 1) {
      const linkAnchorColumn = linkColumns[1];
      const link = linkAnchorColumn.querySelector('a');
      if (link) {
        linkData.link = link.href || link.getAttribute('href') || '#';
      }
    }

    if (linkData.text) {
      legalLinksData.links.push(linkData);
    }
  });

  return legalLinksData;
}

export default async function decorate(block) {
  const isEditorMode = block.hasAttribute('data-aue-resource')
    || block.hasAttribute('data-aue-type')
    || block.closest('[data-aue-resource]')
    || block.closest('[data-aue-type]');
  if (isEditorMode) {
    return; // 编辑模式下不修改 DOM
  }

  let section = block;
  if (block.classList.contains('section')) {
    section = block;
  } else if (block.classList.contains('footer')) {
    section = Array.from(block.querySelectorAll('.section')).find((el) => {
      const classList = Array.from(el.classList);
      return classList.some((cls) => cls.match(/^footer-.*-container$/));
    });
    if (!section) {
      section = block.querySelector('.section');
    }
  }

  if (!section) {
    return;
  }

  const data = {
    logo: extractLogoData(section),
    navColumns: extractNavColumnsData(section),
    legalLinks: extractLegalLinksData(section),
  };

  const footer = document.createElement('footer');
  footer.id = 'footer';

  const container = document.createElement('div');
  container.className = 'footer-container';

  const footerTop = document.createElement('div');
  footerTop.className = 'footer-top h-grid-container';

  if (data.logo.image || data.logo.social.length > 0) {
    const logoDiv = document.createElement('div');
    logoDiv.className = 'footer-logo';

    if (data.logo.image) {
      // 如果有链接，将图片包装在链接?
      if (data.logo.link && data.logo.link !== '#') {
        const logoLink = document.createElement('a');
        logoLink.href = data.logo.link;
        logoLink.className = 'footer-logo-link';
        if (data.logo.alt) {
          logoLink.setAttribute('aria-label', data.logo.alt);
        }
        const logoImg = data.logo.image;
        logoImg.className = 'footer-logo-width';
        logoLink.appendChild(logoImg);
        logoDiv.appendChild(logoLink);
      } else {
        logoDiv.appendChild(data.logo.image);
      }
      // 设置 alt ?
      if (data.logo.alt && data.logo.image.tagName === 'IMG') {
        data.logo.image.alt = data.logo.alt;
      }
    }

    if (data.logo.social.length > 0) {
      const socialDiv = document.createElement('div');
      socialDiv.className = 'footer-social';
      data.logo.social.forEach((socialImg) => {
        socialDiv.appendChild(socialImg);
      });
      logoDiv.appendChild(socialDiv);
    }

    footerTop.appendChild(logoDiv);
  }

  if (data.navColumns.length > 0) {
    const navDiv = document.createElement('div');
    navDiv.className = 'footer-nav';

    data.navColumns.forEach((columnData) => {
      const columnDiv = document.createElement('div');
      columnDiv.className = 'footer-nav-column footer-context-hide';

      if (columnData.title) {
        const mobileFooterTitle = document.createElement('div');
        mobileFooterTitle.className = 'footer-nav-column-title';
        mobileFooterTitle.textContent = columnData.title;
        const arrow = document.createElement('img');
        arrow.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
        const mobileFooterTitleLine = document.createElement('div');
        mobileFooterTitleLine.className = 'mobile-footer-title-line';
        mobileFooterTitleLine.addEventListener('click', (e) => {
          // e.stopPropagation();
          const grandParent = e.target.closest('.footer-nav-column');
          if (!grandParent) { return; }
          grandParent.classList.toggle('footer-context-hide');
        });
        mobileFooterTitleLine.append(mobileFooterTitle, arrow);
        columnDiv.appendChild(mobileFooterTitleLine);
      }

      if (columnData.items.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'footer-nav-column-list';

        columnData.items.forEach((itemData) => {
          const li = document.createElement('li');
          li.className = 'footer-nav-column-item';

          const a = document.createElement('a');
          a.className = 'footer-nav-column-link';
          a.href = processPath(itemData.link);
          a.textContent = itemData.text;
          li.appendChild(a);

          if (!isInternalLink(itemData.link)) {
            const img = document.createElement('img');
            img.src = `/content/dam/hisense/${country}/common-icons/share.svg`;
            li.appendChild(img);
          }
          ul.appendChild(li);
        });

        columnDiv.appendChild(ul);
      }

      navDiv.appendChild(columnDiv);
    });

    footerTop.appendChild(navDiv);
  }

  container.appendChild(footerTop);

  if (data.legalLinks.links.length > 0 || data.legalLinks.copyright) {
    const footerBottom = document.createElement('div');
    footerBottom.className = 'footer-bottom';
    const footerLegals = document.createElement('div');
    footerLegals.className = 'footer-legals  h-grid-container';
    const footerLegalsLeft = document.createElement('div');
    footerLegalsLeft.className = 'footer-legals footer-legals-item-left h-grid-container';

    const footerLegalsRight = document.createElement('div');
    footerLegalsRight.className = 'footer-legals footer-legals-item-right h-grid-container';
    if (data.legalLinks.icon1) {
      const icon1 = document.createElement('img');
      icon1.className = 'footer-legals-icon';
      icon1.src = data.legalLinks.icon1;
      footerLegalsRight.appendChild(icon1);
    }
    if (data.legalLinks.icon2) {
      const icon2 = document.createElement('img');
      icon2.className = 'footer-legals-icon';
      icon2.src = data.legalLinks.icon2;
      footerLegalsRight.appendChild(icon2);
    }

    if (data.legalLinks.links.length > 0) {
      const legalLinksDiv = document.createElement('div');
      legalLinksDiv.className = 'footer-legal-links';

      data.legalLinks.links.forEach((linkData) => {
        const a = document.createElement('a');
        const span = document.createElement('span');
        span.className = 'footer-legal-link';
        a.href = processPath(linkData.link);
        a.textContent = linkData.text;
        span.appendChild(a);
        legalLinksDiv.appendChild(span);
      });

      footerLegalsLeft.appendChild(legalLinksDiv);
    }

    if (data.legalLinks.copyright) {
      const copyrightDiv = document.createElement('div');
      copyrightDiv.className = 'footer-copyright';
      copyrightDiv.textContent = data.legalLinks.copyright;
      footerLegalsLeft.appendChild(copyrightDiv);
    }

    const getRegionUrl = () => {
      const baseUrl = window.GRAPHQL_BASE_URL || '';
      const isEditMode = block.hasAttribute('data-aue-resource');
      const fiveMinutesMs = 5 * 60 * 1000;
      const cacheBuster = simpleHash(Math.floor(Date.now() / fiveMinutesMs));
      const localizedPath = buildLocalizedFooterPath(window.location.pathname);
      return `${baseUrl}${isEditMode ? '/bin' : '/api'}${REGION}?path=${localizedPath}&_t=${cacheBuster}`;
    };

    const regionData = await fetchRegionData(getRegionUrl());
    // TODO：中国区使用mock数据
    const selectedCountry = regionData?.country?.code === 'cn' ? {
      code: 'cn',
      languages: { zh: '中文', en: 'English' },
      name: '全球站点',
      selectedLanguage: 'zh',
    } : resolveRegionCountryData(regionData);
    const generateLanguageItems = (languages, selectedLang) => {
      let languageItems = '';
      const langKeys = Object.keys(languages || {});
      if (!langKeys.length) {
        return languageItems;
      }

      const activeLanguage = (selectedLang && languages[selectedLang]) ? selectedLang : langKeys[0];
      languageItems += `<div class="footer-lan-item active" data-lang="${activeLanguage}">${languages[activeLanguage]}</div>`;
      langKeys.forEach((langKey) => {
        if (langKey === activeLanguage) return;
        languageItems += '<div class="footer-lan-line"></div>';
        languageItems += `<div class="footer-lan-item" data-lang="${langKey}">${languages[langKey]}</div>`;
      });

      return languageItems;
    };

    const lanGroup = document.createElement('div');
    lanGroup.className = 'footer-lan-group';
    lanGroup.innerHTML = selectedCountry ? `
  <img class="region-icon" src="/content/dam/hisense/${country}/common-icons/global.svg" alt="" />
  <div class="footer-lan-com">${selectedCountry.name}</div>
  <div class="footer-lan-list">
    ${generateLanguageItems(selectedCountry.languages, selectedCountry.selectedLanguage)}
  </div>` : `
  <img class="region-icon" src="/content/dam/hisense/${country}/common-icons/global.svg" alt="" />
  <div class="footer-lan-list">
    ${generateLanguageItems(languageList.reduce((acc, l) => {
    acc[l] = translate('LANGUAGE_NAME', l);
    return acc;
  }, {}), language)}
  </div>`;
    if (country === 'global') {
      lanGroup.style.alignItems = 'flex-start';
    }
    const regionIcon = lanGroup.querySelector('.region-icon');
    if (regionIcon) {
      regionIcon.addEventListener('click', () => {
        window.location.href = selectedCountry.code === 'cn' ? 'https://www.hisense.com/global-site.html' : buildRegionSelectionPath(selectedCountry.selectedLanguage);
      });
    }
    const lanComEl = lanGroup.querySelector('.footer-lan-com');
    if (lanComEl) {
      lanComEl.addEventListener('click', () => {
        window.location.href = selectedCountry.code === 'cn' ? 'https://www.hisense.com/global-site.html' : buildRegionSelectionPath(selectedCountry.selectedLanguage);
      });
    }
    const langItems = lanGroup.querySelectorAll('.footer-lan-item');
    if (selectedCountry?.code === 'cn') {
      langItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          window.location.href = e.currentTarget.getAttribute('data-lang') === 'zh' ? '' : '/us/en';
        });
      });
    } else {
      langItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          if (e.currentTarget.classList.contains('active')) {
            window.location.href = '';
            return;
          }
          window.location.href = buildLocalizedPathForLanguage(e.currentTarget.getAttribute('data-lang'));
        });
      });
    }

    footerLegalsLeft.appendChild(lanGroup);

    footerLegals.append(footerLegalsLeft, footerLegalsRight);
    footerBottom.appendChild(footerLegals);
    container.appendChild(footerBottom);
  }

  footer.appendChild(container);

  section.textContent = '';
  section.appendChild(footer);

  if (block.classList.contains('footer') && block !== section) {
    block.textContent = '';
    block.appendChild(section);
  }
}
