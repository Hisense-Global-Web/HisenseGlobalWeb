export default function decorate(block) {
  const [tagEl, cityStoreEl, contentWrapper1El, contentWrapper2El, label3El, ...typeList] = [...block.children] ?? [];
  tagEl.className = 'tag';
  if (cityStoreEl) {
    cityStoreEl.className = 'city-store-wrapper';
    const [cityEl, storeEl] = cityStoreEl?.querySelectorAll('p') ?? [];
    cityEl?.classList?.add('city');
    storeEl?.classList?.add('store');
  }
  const bottomWrapper = document.createElement('div');
  bottomWrapper.className = 'bottom-wrapper';
  if (contentWrapper1El) {
    contentWrapper1El.className = 'content-wrapper';
    const [title, content] = contentWrapper1El?.querySelectorAll('p') ?? [];
    title?.classList?.add('title');
    content?.classList?.add('content');
    bottomWrapper.appendChild(contentWrapper1El);
  }
  if (contentWrapper2El) {
    contentWrapper2El.className = 'content-wrapper';
    const [title, content] = contentWrapper2El?.querySelectorAll('p') ?? [];
    title?.classList?.add('title');
    content?.classList?.add('content');
    bottomWrapper.appendChild(contentWrapper2El);
  }
  if (label3El) {
    label3El.className = 'title';
    const typeWrapperEl = document.createElement('div');
    typeWrapperEl.className = 'type-wrapper';
    typeWrapperEl.appendChild(label3El);
    const typeListWrapperEl = document.createElement('div');
    typeListWrapperEl.className = 'type-list-wrapper';
    if (typeList?.length) {
      typeList.forEach((typeEl) => {
        const iconTextWrapper = typeEl?.children?.[0];
        if (iconTextWrapper) {
          iconTextWrapper.className = 'icon-text-wrapper';
          // eslint-disable-next-line no-unused-vars
          const [icon, text] = [...iconTextWrapper.children] ?? [];
          if (text) {
            text.className = 'type-text';
          }
        }
        typeListWrapperEl.appendChild(typeEl);
      });
    }
    typeWrapperEl.appendChild(typeListWrapperEl);
    bottomWrapper.appendChild(typeWrapperEl);
  }
  block.appendChild(bottomWrapper);
}
