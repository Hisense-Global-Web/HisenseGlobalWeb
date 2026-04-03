export default function decorate(block) {
  // const config = readBlockConfig(block);
  const [stage, category, ...infoList] = [...block.children];
  stage?.parentNode?.parentNode?.setAttribute('data-tag', stage.lastElementChild.textContent?.trim());
  category.parentNode?.parentNode?.setAttribute('data-item-tag', category.lastElementChild.textContent?.trim());
  stage?.remove?.();
  category?.remove?.();
  // const wrapper = document.createElement('div');
  // wrapper.className = 'list-card-container';
  infoList?.forEach((info) => {
    if (info.children.length > 1) {
      info.className = info.firstElementChild.textContent?.trim();
      info.firstElementChild?.remove?.();
    } else {
      info.className = 'sever-item';
    }
    // wrapper.append(info);
  });
  // block.replaceChildren(wrapper);
}
