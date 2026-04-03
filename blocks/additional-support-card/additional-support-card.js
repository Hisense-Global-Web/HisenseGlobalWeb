const EButtonAction = Object.freeze({
  pageRedirect: 'pageRedirect',
  phoneCall: 'phoneCall',
  sendEmail: 'sendEmail',
});

const EStartStr = Object.freeze({
  mailTo: 'mailto:',
  tel: 'tel:',
});

const setStartStr = (link, startStr) => {
  if (link?.startsWith(startStr)) {
    return link;
  }
  return `${startStr}${link}`;
};

export default function decorate(block) {
  try {
    const [columnNumberEl, ...elementItems] = [...block.children];
    const pcColumn = columnNumberEl?.querySelector?.('p')?.textContent || '4';
    columnNumberEl?.remove();

    const meidaCardQuery = window.matchMedia('(min-width: 860px)');

    const handleCardMediaChange = (e) => {
      if (e.matches) {
        // PC
        block.style.cssText = `grid-template-columns: repeat(${pcColumn}, 1fr)`;
      } else {
        // Mobile
        block.style.cssText = '';
      }
    };

    handleCardMediaChange(meidaCardQuery);

    elementItems.forEach((element) => {
      element.classList.add('additional-support-card-item');
      const [iconEl, titleEl, subtitleEl, timeContainerEl, contactInfoContainerEl, buttonLinkEl, buttonStyleEl, buttonActionEl, displayButtonEl] = element.children;
      iconEl?.classList?.add('icon');
      titleEl?.classList?.add('title');
      subtitleEl?.classList?.add('subtitle');
      const buttonStyle = buttonStyleEl?.querySelector('p')?.textContent || 'white';
      const buttonAction = buttonActionEl?.querySelector('p')?.textContent || EButtonAction.pageRedirect;

      timeContainerEl?.classList?.add('time-container');
      contactInfoContainerEl?.classList?.add('contact-info-container');
      const contactInofEl = contactInfoContainerEl?.querySelector('p');
      if (contactInofEl) {
        contactInofEl.classList.add('contact-info');
      }
      const contactInfoText = contactInofEl?.querySelector('p')?.textContent || null;
      const topEl = document.createElement('div');
      topEl.className = 'top';
      topEl.appendChild(iconEl);
      const titleContainer = document.createElement('div');
      titleContainer.className = 'title-container';
      titleContainer.appendChild(titleEl);
      titleContainer.appendChild(subtitleEl);
      topEl.appendChild(titleContainer);
      const timePhoneContainer = document.createElement('div');
      timePhoneContainer.className = 'time-phone-container';
      timePhoneContainer.appendChild(timeContainerEl);
      timePhoneContainer.appendChild(contactInfoContainerEl);
      topEl.appendChild(timePhoneContainer);

      const displayButtonValue = displayButtonEl?.querySelector('p')?.innerHTML || '';
      if (displayButtonValue === 'mobile-only') {
        buttonLinkEl?.classList?.add('button-hidden');
      }
      let buttonALink = buttonLinkEl?.querySelector('a');
      if (!buttonALink) {
        buttonALink = buttonLinkEl?.querySelector('p');
      }
      if (buttonALink) {
        buttonALink?.classList?.remove('button');
        buttonALink?.classList?.add('link');
        if (buttonStyle === 'white') {
          buttonALink.classList.add('button-white');
        } else if (buttonStyle === 'green60') {
          buttonALink.classList.add('button-green60');
        }
        const buttonText = buttonLinkEl?.children?.[0] ?? '';
        buttonALink.textContent = buttonText?.textContent || '';
        if (buttonLinkEl.querySelector('a')) {
          buttonText?.remove();
        }

        buttonALink.addEventListener('click', () => {
          // 页面直接跳转
          if (buttonAction === EButtonAction.pageRedirect) {
            window.location = buttonALink;
          } else if (buttonAction === EButtonAction.sendEmail) {
            const link = contactInfoText?.trim()?.length > 0 ? setStartStr(contactInfoText.trim(), EStartStr.mailTo) : setStartStr(buttonALink.trim(), EStartStr.mailTo);
            const emailLink = document.createElement('a');
            emailLink.href = link;
            emailLink.click();
          } else if (buttonAction === EButtonAction.phoneCall) {
            const link = contactInfoText?.trim()?.length > 0 ? setStartStr(contactInfoText.trim(), EStartStr.tel) : setStartStr(buttonALink.trim(), EStartStr.tel);
            const phoneLink = document.createElement('a');
            phoneLink.href = link;
            phoneLink.click();
          }
        }, true);
      }

      buttonStyleEl?.remove();
      buttonActionEl?.remove();
      displayButtonEl?.remove();
      element.prepend(topEl);
      const bottomEl = document.createElement('div');
      bottomEl.className = 'bottom';
      bottomEl.appendChild(buttonLinkEl);
      element.appendChild(bottomEl);
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Additional Support Card block decoration error:', error);
  }
}
