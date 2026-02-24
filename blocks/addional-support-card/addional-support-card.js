export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('addional-support-card-item');
      const [icon, title, subtitle, timeContainer, phoneNumber, displayButton, buttonLink] = element.children;
      icon?.classList?.add('addional-support-card-item-icon');
      title?.classList?.add('addional-support-card-item-title');
      subtitle?.classList?.add('addional-support-card-item-subtitle');
      timeContainer?.classList?.add('addional-support-card-item-time-container');
      const workingTime = timeContainer?.children[0];
      const responseTime = timeContainer?.children[1];
      workingTime?.classList?.add('working-time');
      responseTime?.classList?.add('response-time');
      phoneNumber?.children[0]?.classList?.add('phone-number');
      const displayButtonValue = displayButton?.querySelector('p')?.innerHTML || '';
      displayButton.style.display = 'none';
      if (displayButtonValue === 'mobile-only') {
        buttonLink?.classList?.add('button-hidden');
        phoneNumber?.classList?.add('phone-number-hidden');
      }
      const buttonALink = buttonLink?.querySelector('a');
      if (buttonALink) {
        buttonALink?.classList?.remove('button');
        buttonALink?.classList?.add('addional-support-card-item-link');
        // Live Chart 可能需要第三方来实现，所以此处暂时注释掉
        // if (index === 0) {
        //   const circleDiv = document.createElement('div');
        //   circleDiv.classList.add('main-circle');
        //   timeDivContainer.insertBefore(circleDiv, workingTime);
        //   workingTime?.classList?.add('main-working-time');
        //   responseTime?.classList?.add('main-response-time');
        // }
        const buttonText = buttonLink?.children?.[1] ?? '';
        buttonLink.querySelector('a').innerHTML = buttonText?.innerHTML || '';
        buttonText?.remove();
      }
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Addional Support Card block decoration error:', error);
  }
}
