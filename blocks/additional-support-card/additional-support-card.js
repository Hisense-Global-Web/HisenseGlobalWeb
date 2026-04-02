export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('additional-support-card-item');
      const [icon, title, subtitle, showCircleEl, timeContainer, phoneNumber, displayButton, buttonLink, buttonStyleEl] = element.children;
      icon?.classList?.add('additional-support-card-item-icon');
      title?.classList?.add('additional-support-card-item-title');
      subtitle?.classList?.add('additional-support-card-item-subtitle');
      const showCircle = showCircleEl?.querySelector('p')?.textContent?.toLowerCase() === 'true';
      const buttonStyle = buttonStyleEl?.querySelector('p')?.textContent || 'white';

      timeContainer?.classList?.add('additional-support-card-item-time-container');
      const workingTime = timeContainer?.children[0];
      const responseTime = timeContainer?.children[1];
      workingTime?.classList?.add('working-time');
      responseTime?.classList?.add('response-time');
      const circleEl = document.createElement('div');
      if (showCircle) {
        circleEl.classList.add('main-circle');
        timeContainer.prepend(circleEl);
      }
      phoneNumber?.children[0]?.classList?.add('phone-number');
      const phoneNumberText = phoneNumber?.children[0]?.textContent || null;
      const displayButtonValue = displayButton?.querySelector('p')?.innerHTML || '';
      displayButton.style.display = 'none';
      if (displayButtonValue === 'mobile-only') {
        buttonLink?.classList?.add('button-hidden');
        phoneNumber?.classList?.add('phone-number-hidden');
      }
      let buttonALink = buttonLink?.querySelector('a');
      if (!buttonALink) {
        buttonALink = buttonLink?.querySelector('p');
      }
      if (buttonALink) {
        buttonALink?.classList?.remove('button');
        buttonALink?.classList?.add('additional-support-card-item-link');
        if (buttonStyle === 'white') {
          buttonALink.classList.add('button-white');
        } else if (buttonStyle === 'green60') {
          buttonALink.classList.add('button-green60');
        }
        const buttonText = buttonLink?.children?.[0] ?? '';
        buttonALink.textContent = buttonText?.textContent || '';
        if (buttonLink.querySelector('a')) {
          buttonText?.remove();
        }

        if (phoneNumberText) {
          buttonALink.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = `tel:${phoneNumberText}`;
            link.click();
          }, true);
        }
      }
      showCircleEl?.remove();
      buttonStyleEl?.remove();

      // 计算最大高度并设置所有卡片项的高度一致，确保在不同内容长度时卡片高度统一
      setTimeout(() => {
        const cardItems = block.querySelectorAll('.additional-support-card-item');
        const maxHeight = Math.max(...Array.from(cardItems).map((item) => item.offsetHeight));
        cardItems.forEach((item) => {
          item.style.height = `${maxHeight}px`;
        });
      }, 50);
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Additional Support Card block decoration error:', error);
  }
}
