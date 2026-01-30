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

  if (logoDivs.length > 0) {
    const firstDiv = logoDivs[0];
    const innerDiv = firstDiv.querySelector('div');
    if (innerDiv) {
      const logoPicture = innerDiv.querySelector('picture');
      if (logoPicture) {
        const logoImg = logoPicture.querySelector('img');
        if (logoImg) {
          logoData.image = logoImg.cloneNode(true);
        }
      } else {
        const logoImg = innerDiv.querySelector('img');
        if (logoImg) {
          logoData.image = logoImg.cloneNode(true);
        }
      }
    }
  }

  if (logoDivs.length > 1) {
    const altDiv = logoDivs[1];
    const innerDiv = altDiv.querySelector('div');
    if (innerDiv) {
      const altP = innerDiv.querySelector('p');
      if (altP) {
        logoData.alt = altP.textContent.trim();
      }
    }
  }

  if (logoDivs.length > 2) {
    const linkDiv = logoDivs[2];
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
    if (index < 3) {
      return;
    }

    const innerDiv = div.querySelector('div');
    if (!innerDiv) {
      return;
    }

    const socialPicture = innerDiv.querySelector('picture');
    const imgBox = document.createElement('div');
    imgBox.className = 'footer-social-imgbox';
    if (socialPicture) {
      const socialImg = socialPicture.querySelector('img');
      socialImg.className = 'footer-social-width';
      const socialLink = div.querySelector('a');
      if (socialImg) {
        imgBox.appendChild(socialImg);
        if (socialLink) {
          imgBox.appendChild(socialLink);
        }
        logoData.social.push(imgBox.cloneNode(true));
      }
    } else {
      const socialImg = innerDiv.querySelector('img');
      socialImg.className = 'footer-social-width';
      const socialLink = innerDiv.querySelector('a');
      if (socialImg) {
        imgBox.appendChild(socialImg);
        if (socialLink) {
          imgBox.appendChild(socialLink);
        }
        logoData.social.push(imgBox.cloneNode(true));
      }
    }
  });

  return logoData;
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
          itemData.link = link.href || link.getAttribute('href') || '#';
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
  };

  const legalLinksBlock = container.querySelector('.footer-legal-links');
  if (!legalLinksBlock) {
    return legalLinksData;
  }

  const legalItemRows = Array.from(legalLinksBlock.children).filter((child) => child.tagName === 'DIV');

  let legalLinksStartIndex = 0;
  if (legalItemRows.length > 0) {
    const copyrightRow = legalItemRows[0];
    const copyrightText = copyrightRow.textContent.trim();
    if (copyrightText) {
      legalLinksData.copyright = copyrightText;
      legalLinksStartIndex = 1;
    }
  }

  legalItemRows.forEach((row, index) => {
    if (index < legalLinksStartIndex) {
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

export default function decorate(block) {
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
        arrow.src = '/content/dam/hisense/us/common-icons/chevron-up.svg';
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
          a.href = itemData.link;
          a.textContent = itemData.text;
          li.appendChild(a);

          if (!isInternalLink(itemData.link)) {
            const img = document.createElement('img');
            img.src = '/content/dam/hisense/us/common-icons/share.svg';
            // li.appendChild(img);
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

    if (data.legalLinks.links.length > 0) {
      const legalLinksDiv = document.createElement('div');
      legalLinksDiv.className = 'footer-legal-links';

      data.legalLinks.links.forEach((linkData) => {
        const a = document.createElement('a');
        a.className = 'footer-legal-link';
        a.href = linkData.link;
        a.textContent = linkData.text;
        legalLinksDiv.appendChild(a);
      });

      footerLegals.appendChild(legalLinksDiv);
    }

    if (data.legalLinks.copyright) {
      const copyrightDiv = document.createElement('div');
      copyrightDiv.className = 'footer-copyright';
      copyrightDiv.textContent = data.legalLinks.copyright;
      footerLegals.appendChild(copyrightDiv);
    }

    const lanGroup = document.createElement('div');
    lanGroup.className = 'footer-lan-group';
    lanGroup.innerHTML = `
  <img src="/content/dam/hisense/us/common-icons/global.svg" alt="" />
  <div class="footer-lan-com">United States</div>
  <div class="footer-lan-list">
    <div class="footer-lan-item active">English</div>
<!--    <div class="footer-lan-line"></div>-->
<!--    <div class="footer-lan-item">Français</div>-->
  </div>`;
    footerLegals.appendChild(lanGroup);

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
