function cardClickHandler(link) {
  window.location.href = link;
}

export default function decorate(block) {
  try {
    const elementItems = [...block.children];
    elementItems.forEach((element) => {
      element.classList.add('quick-action-card-item');
      // icon
      const icon = element.children[0];
      icon.classList.add('quick-action-card-image');
      // 描述信息
      const description = element.children[1];
      description.classList.add('quick-action-card-description');
      // Link连接
      const buttonDiv = element.children[2];
      buttonDiv.classList.add('quick-action-card-view-more');
      const buttonLink = buttonDiv.querySelector('a');
      buttonLink.classList.remove('button');
      // Mobile端的按钮文案
      const buttonText = element.children[3];
      buttonLink.innerHTML = buttonText.innerHTML || 'View More';
      buttonText?.remove();

      const clickHandler = (e) => {
        e.stopPropagation();
        const link = buttonLink.getAttribute('href');
        cardClickHandler(link);
      };

      // 使用 matchMedia API
      const mediaQuery = window.matchMedia('(min-width: 860px)');

      function handleMediaChange(e) {
        if (e.matches) {
          // 桌面模式：添加 click 事件（点击整个卡片）
          element.addEventListener('click', clickHandler);
        } else {
          // 移动模式：移除 click 事件（只点击按钮跳转）
          element.removeEventListener('click', clickHandler);
        }
      }

      // 初始调用
      handleMediaChange(mediaQuery);

      // 监听媒体查询变化
      mediaQuery.addEventListener('change', handleMediaChange);
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Quick Action block decoration error:', error);
  }
}
