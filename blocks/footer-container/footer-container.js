export default function decorate(block) {
  // 检查是否在编辑模式
  const isEditorMode = block.hasAttribute('data-aue-resource')
    || block.hasAttribute('data-aue-type')
    || block.closest('[data-aue-resource]')
    || block.closest('[data-aue-type]');
  if (isEditorMode) {
    return; // 编辑模式下不修改 DOM
  }

  const footer = document.createElement('footer');
  footer.id = 'footer';

  const container = document.createElement('div');
  container.className = 'footer-container';

  const footerTop = document.createElement('div');
  footerTop.className = 'footer-top';

  // 处理 footer-logo
  const logoWrapper = block.querySelector('.footer-logo-wrapper');
  if (logoWrapper) {
    const logoBlock = logoWrapper.querySelector('.footer-logo');
    if (logoBlock) {
      const logoDiv = document.createElement('div');
      logoDiv.className = 'footer-logo';

      // Logo 图片
      const logoImg = logoBlock.querySelector('picture img, img');
      if (logoImg) {
        const img = logoImg.cloneNode(true);
        logoDiv.appendChild(img);
      }

      // 社交图标
      const socialWrappers = block.querySelectorAll('.footer-social-wrapper');
      if (socialWrappers.length > 0) {
        const socialDiv = document.createElement('div');
        socialDiv.className = 'footer-social';
        socialWrappers.forEach((wrapper) => {
          const socialBlock = wrapper.querySelector('.footer-social');
          const socialImg = socialBlock?.querySelector('picture img, img');
          if (socialImg) {
            const img = socialImg.cloneNode(true);
            socialDiv.appendChild(img);
          }
        });
        logoDiv.appendChild(socialDiv);
      }

      footerTop.appendChild(logoDiv);
    }
  }

  // 处理 footer-nav-column
  const navColumns = block.querySelectorAll('.footer-nav-column-wrapper');
  if (navColumns.length > 0) {
    const navDiv = document.createElement('div');
    navDiv.className = 'footer-nav';

    navColumns.forEach((columnWrapper) => {
      const columnBlock = columnWrapper.querySelector('.footer-nav-column');
      if (columnBlock) {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'footer-nav-column';

        // 标题
        const titleField = columnBlock.querySelector('[data-aue-prop="title"]');
        if (titleField) {
          const title = document.createElement('h4');
          title.className = 'footer-nav-column-title';
          title.textContent = titleField.textContent.trim();
          columnDiv.appendChild(title);
        }

        // 列表项
        const listItems = columnBlock.querySelectorAll('.footer-nav-column-list-wrapper');
        if (listItems.length > 0) {
          const ul = document.createElement('ul');
          ul.className = 'footer-nav-column-list';

          listItems.forEach((itemWrapper) => {
            const itemBlock = itemWrapper.querySelector('.footer-nav-column-list');
            if (itemBlock) {
              const li = document.createElement('li');
              li.className = 'footer-nav-column-item';

              const linkField = itemBlock.querySelector('[data-aue-prop="link"]');
              const textField = itemBlock.querySelector('[data-aue-prop="text"]');
              if (linkField || textField) {
                const a = document.createElement('a');
                a.className = 'footer-nav-column-link';
                a.href = linkField?.querySelector('a')?.href || '#';
                a.textContent = textField?.textContent.trim() || '';
                li.appendChild(a);
              }

              ul.appendChild(li);
            }
          });

          columnDiv.appendChild(ul);
        }

        navDiv.appendChild(columnDiv);
      }
    });

    footerTop.appendChild(navDiv);
  }

  container.appendChild(footerTop);

  // 处理 footer-legal-links
  const legalWrapper = block.querySelector('.footer-legal-links-wrapper');
  if (legalWrapper) {
    const legalBlock = legalWrapper.querySelector('.footer-legal-links');
    if (legalBlock) {
      const footerBottom = document.createElement('div');
      footerBottom.className = 'footer-bottom';

      const legalLinksDiv = document.createElement('div');
      legalLinksDiv.className = 'footer-legal-links';

      // 获取所有 footer-legal-link-item block items
      const linkItemWrappers = legalBlock.querySelectorAll('.footer-legal-link-item-wrapper');
      linkItemWrappers.forEach((itemWrapper) => {
        const itemBlock = itemWrapper.querySelector('.footer-legal-link-item');
        if (itemBlock) {
          const linkField = itemBlock.querySelector('[data-aue-prop="link"]');
          const textField = itemBlock.querySelector('[data-aue-prop="text"]');
          if (linkField || textField) {
            const a = document.createElement('a');
            a.className = 'footer-legal-link';
            const linkAnchor = linkField?.querySelector('a');
            a.href = linkAnchor?.href || linkAnchor?.getAttribute('href') || '#';
            a.textContent = textField?.textContent.trim() || '';
            legalLinksDiv.appendChild(a);
          }
        }
      });

      footerBottom.appendChild(legalLinksDiv);

      // 版权信息
      const copyrightField = legalBlock.querySelector('[data-aue-prop="copyright"]');
      if (copyrightField) {
        const copyrightDiv = document.createElement('div');
        copyrightDiv.className = 'footer-copyright';
        copyrightDiv.textContent = copyrightField.textContent.trim();
        footerBottom.appendChild(copyrightDiv);
      }

      container.appendChild(footerBottom);
    }
  }

  footer.appendChild(container);
  block.textContent = '';
  block.appendChild(footer);
}
