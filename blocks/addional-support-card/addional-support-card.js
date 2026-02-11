export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('addional-support-card-item');
      console.log('element:', element);
      const [icon, title, subtitle, workingTime, responseTime, buttonLink, buttonText] = element.children;
      icon?.classList?.add('addional-support-card-item-icon');
      title?.classList?.add('addional-support-card-item-title');
      subtitle?.classList?.add('addional-support-card-item-subtitle');
      // 将working time和response time合并到一个div中
      workingTime?.classList?.add('working-time');
      responseTime?.classList?.add('response-time');
      const timeDivContainer = document.createElement('div');
      timeDivContainer.appendChild(workingTime);
      timeDivContainer.appendChild(responseTime);
      element.insertBefore(timeDivContainer, buttonLink);
      timeDivContainer.classList.add('addional-support-card-item-time-container');
      buttonText?.classList?.add('addional-support-card-item-link-text');
      const buttonALink = buttonLink.querySelector('a');
      buttonALink.classList.remove('button');
      buttonALink.classList.add('addional-support-card-item-link');
      // Live Chart 可能需要第三方来实现，所以此处暂时注释掉
      // if (index === 0) {
      //   const circleDiv = document.createElement('div');
      //   circleDiv.classList.add('main-circle');
      //   timeDivContainer.insertBefore(circleDiv, workingTime);
      //   workingTime?.classList?.add('main-working-time');
      //   responseTime?.classList?.add('main-response-time');
      // }
      buttonLink.querySelector('a').innerHTML = buttonText?.querySelector('p')?.innerHTML || '';
      buttonText?.remove();
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Addional Support Card block decoration error:', error);
  }
}
