export default function decorate(block) {
  const children = [...block.children];

  const logoDiv = children[0];
  const logoPicture = logoDiv?.querySelector('picture');

  const logoLinkDiv = children[1];
  const logoLink = logoLinkDiv?.querySelector('a');

  // Separate navigation items and actions
  const navItems = [];
  const navActions = [];

  children.slice(2).forEach((itemDiv) => {
    // Check if it's a navigation action (has icon/picture)
    const iconPicture = itemDiv.querySelector('picture');
    const iconImg = itemDiv.querySelector('img:not(picture img)');
    const hasIcon = iconPicture || iconImg;
    const link = itemDiv.querySelector('a');
    const textDiv = itemDiv.querySelector('div:last-child');
    const text = textDiv?.querySelector('p')?.textContent || '';

    const item = {
      link: link?.href || '',
      text: text.trim(),
      icon: hasIcon ? (iconPicture || iconImg) : null,
    };

    if (hasIcon) {
      navActions.push(item);
    } else {
      navItems.push(item);
    }
  });

  block.textContent = '';
  block.id = 'navigation';

  const navContainer = document.createElement('div');
  navContainer.className = 'nav-container';

  if (logoPicture) {
    const navLogo = document.createElement('div');
    navLogo.className = 'nav-logo';

    if (logoLink) {
      const logoLinkElement = document.createElement('a');
      logoLinkElement.href = logoLink.href;
      logoLinkElement.title = logoLink.title || '';
      logoLinkElement.append(logoPicture.cloneNode(true));
      navLogo.append(logoLinkElement);
    } else {
      navLogo.append(logoPicture.cloneNode(true));
    }

    navContainer.append(navLogo);
  }

  if (navItems.length > 0) {
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';

    navItems.forEach((item) => {
      const navLink = document.createElement('div');
      navLink.className = 'nav-link';

      if (item.link) {
        const linkElement = document.createElement('a');
        linkElement.href = item.link;
        linkElement.textContent = item.text;
        navLink.append(linkElement);
      } else {
        navLink.textContent = item.text;
      }

      navLinks.append(navLink);
    });

    navContainer.append(navLinks);
  }

  if (navActions.length > 0) {
    const navActionsContainer = document.createElement('div');
    navActionsContainer.className = 'nav-actions';

    navActions.forEach((action) => {
      const navAction = document.createElement('div');
      navAction.className = 'nav-link';

      if (action.link) {
        const linkElement = document.createElement('a');
        linkElement.href = action.link;
        linkElement.title = action.text;

        if (action.icon) {
          const iconElement = action.icon.cloneNode(true);
          linkElement.append(iconElement);
        }

        if (action.text) {
          const textElement = document.createElement('span');
          textElement.textContent = action.text;
          linkElement.append(textElement);
        }

        navAction.append(linkElement);
      } else {
        if (action.icon) {
          const iconElement = action.icon.cloneNode(true);
          navAction.append(iconElement);
        }
        if (action.text) {
          navAction.append(document.createTextNode(action.text));
        }
      }

      navActionsContainer.append(navAction);
    });

    navContainer.append(navActionsContainer);
  }

  block.append(navContainer);
}
