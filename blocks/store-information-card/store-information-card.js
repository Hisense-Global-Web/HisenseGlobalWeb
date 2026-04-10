export default function decorate(block) {
  // const config = readBlockConfig(block);
  const [stage, ...infoList] = [...block.children];
  // const wrapper = document.createElement('div');
  // wrapper.className = 'list-card-container';
  const cates = [];
  infoList?.forEach((info) => {
    if (info.children.length > 1) {
      info.className = info.firstElementChild.textContent?.trim();
      info.firstElementChild?.remove?.();
    } else {
      info.className = 'sever-item';
      const [cate, img] = [...info.firstElementChild.children];
      img.className = 'serve-icon';
      cates.push(cate?.textContent);
    }
  });
  const uniqueArr = [...new Set(cates)];
  stage?.parentNode?.parentNode?.setAttribute('data-tag', stage.lastElementChild.textContent?.trim());
  stage.parentNode?.parentNode?.setAttribute('data-item-tag', uniqueArr.join(','));
  stage?.remove?.();
  // block.replaceChildren(wrapper);
}
