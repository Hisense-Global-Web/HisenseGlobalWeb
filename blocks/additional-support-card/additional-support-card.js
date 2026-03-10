export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('additional-support-card-item');
      const [icon, title, subtitle, timeContainer, phoneNumber, displayButton, buttonLink] = element.children;
      icon?.classList?.add('additional-support-card-item-icon');
      title?.classList?.add('additional-support-card-item-title');
      subtitle?.classList?.add('additional-support-card-item-subtitle');
      timeContainer?.classList?.add('additional-support-card-item-time-container');
      const workingTime = timeContainer?.children[0];
      const responseTime = timeContainer?.children[1];
      workingTime?.classList?.add('working-time');
      responseTime?.classList?.add('response-time');
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
        // Live Chart 可能需要第三方来实现，所以此处暂时注释掉
        // if (index === 0) {
        //   const circleDiv = document.createElement('div');
        //   circleDiv.classList.add('main-circle');
        //   timeDivContainer.insertBefore(circleDiv, workingTime);
        //   workingTime?.classList?.add('main-working-time');
        //   responseTime?.classList?.add('main-response-time');
        // }
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
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Additional Support Card block decoration error:', error);
  }
}
