const EItemList = Object.freeze({
  card: 'card', // campaign collection card
  products: 'products', // associated products
});

const EHostType = Object.freeze({
  green: 'green',
  blue: 'blue',
  red: 'red',
});

const backgroundColorMap = new Map();
backgroundColorMap.set(EHostType.green, { dark: 'background-green-dark', light: 'background-green-light', active: 'background-green-active' });
backgroundColorMap.set(EHostType.blue, { dark: 'background-blue-dark', light: 'background-blue-light', active: 'background-blue-active' });
backgroundColorMap.set(EHostType.red, { dark: 'background-red-dark', light: 'background-red-light', active: 'background-red-active' });

const orderMap = { [EHostType.green]: 0, [EHostType.blue]: 1, [EHostType.red]: 2 };

// 排序逻辑
const sortedDivs = (itemList) => [...itemList].sort((a, b) => {
  const getText = (el) => {
    const p = el.querySelectorAll('p')[1];
    return p ? p.textContent.trim().toLowerCase() : '';
  };

  const valA = getText(a);
  const valB = getText(b);
  const weightA = orderMap[valA] ?? Infinity;
  const weightB = orderMap[valB] ?? Infinity;
  return weightA - weightB;
});

const getProductByHostType = (productList, hostType) => {
  const products = [];
  productList.forEach((productEl) => {
    const productHost = productEl.getAttribute('data-host');
    if (productHost === hostType) {
      products.push(productEl);
    }
  });
  return products;
};

const setProductByHostType = (productList, hostType, isEditMode) => {
  productList.forEach((productEl) => {
    const productHost = productEl.getAttribute('data-host');
    if (productHost === hostType) {
      productEl.classList.remove('hide');
      productEl.classList.add(backgroundColorMap.get(hostType).light);
    } else {
      productEl.classList.remove(backgroundColorMap.get(productHost)?.light);
      if (!isEditMode) {
        productEl.classList.add('hide');
      }
    }
  });
};

// 获取campaign collection card和associated products
const getItemListEl = (itemListEl, isEditMode = false) => {
  const cards = [];
  const products = [];
  itemListEl.forEach((item) => {
    const pElList = item?.querySelectorAll('p') ?? [];
    if (pElList[0].textContent?.toLowerCase() === EItemList.card) {
      item.setAttribute('data-host', pElList[1].textContent.trim().toLowerCase());
      cards.push(item);
    } else if (pElList[0].textContent?.toLowerCase() === EItemList.products) {
      item.setAttribute('data-host', pElList[1].textContent.trim().toLowerCase());
      products.push(item);
    }
  });
  if (cards?.length) {
    cards.forEach((card) => {
      const hostType = card.getAttribute('data-host');
      if (!getProductByHostType(products, hostType)?.length) {
        if (!isEditMode) {
          card.classList.add('hide');
        }
      }
    });
  }
  return { cards: sortedDivs(cards), products };
};

const generateProduct = (productEl) => {
  const [titleEL, imageEL, buttonEl] = [...productEl.children] ?? [];
  titleEL.classList.add('product-title');
  imageEL.classList.add('product-image');
  const [btnText, btnLink] = [...buttonEl.children] ?? [];
  if (btnLink?.querySelector('a')) {
    btnText?.remove();
    btnLink.querySelector('a').textContent = btnText?.textContent ?? '';
    btnLink.classList.add('buy-now-button');
  }
  return productEl;
};

export default function decorate(block) {
  const isEditMode = block.hasAttribute('data-aue-resource');
  const [bgPCEl, bgMobileEl, footballEl, leftCloseEl, rightContentEl, secondTitleEl, ...itemListEl] = [...block.children] ?? [];
  bgPCEl.classList.add('background-pc');
  bgMobileEl.classList.add('background-mobile');
  footballEl?.classList?.add('football');
  const contentWrapperEl = document.createElement('div');
  contentWrapperEl.classList.add('content-wrapper');
  leftCloseEl?.classList?.add('left-close');
  rightContentEl.classList.add('right-content');
  const [titleEl, textEl, btnTextEl, btnLinkEl] = rightContentEl.children?.[0]?.children ?? [];
  titleEl?.classList?.add('title');
  textEl?.classList?.add('text');
  btnTextEl?.classList?.add('button');
  const btnLink = btnLinkEl?.querySelector?.('a')?.href ?? null;
  btnLinkEl?.remove?.();
  if (btnLink) {
    btnTextEl.addEventListener('click', () => {
      window.location.href = btnLink;
    });
  }
  contentWrapperEl.appendChild(leftCloseEl);
  contentWrapperEl.appendChild(rightContentEl);
  const firstPardEl = document.createElement('div');
  firstPardEl.classList.add('first-part');
  firstPardEl.appendChild(bgPCEl);
  firstPardEl.appendChild(bgMobileEl);
  firstPardEl.appendChild(footballEl);
  firstPardEl.appendChild(contentWrapperEl);
  block.appendChild(firstPardEl);

  const secondPartEl = document.createElement('div');
  secondPartEl.classList.add('second-part');
  const topWrapperEl = document.createElement('div');
  topWrapperEl.classList.add('top-wrapper');
  secondTitleEl.classList.add('second-title');
  topWrapperEl.appendChild(secondTitleEl);

  const bottomWrapperEl = document.createElement('div');
  bottomWrapperEl.classList.add('bottom-wrapper');

  let currentHostType = EHostType.green;
  secondPartEl.classList.add(backgroundColorMap.get(currentHostType).dark);
  const hostButtonWrapperEl = document.createElement('div');
  hostButtonWrapperEl.classList.add('host-button-wrapper');

  if (itemListEl?.length) {
    // 去掉隐藏的属性
    const removeOtherAttributes = (el) => {
      const [itemType, host] = [...el.children] ?? [];
      itemType?.remove?.();
      host?.remove?.();
      return el;
    };
    const { cards, products } = getItemListEl(itemListEl, isEditMode);
    if (cards?.length) {
      cards.forEach((card) => {
        const newCard = removeOtherAttributes(card);
        newCard.classList.add('button-wrapper');
        if (newCard.getAttribute('data-host') === currentHostType) {
          newCard.classList.add(backgroundColorMap.get(currentHostType).active);
        }
        hostButtonWrapperEl.appendChild(newCard);
      });
      topWrapperEl.appendChild(hostButtonWrapperEl);
    }
    if (products?.length) {
      products.forEach((product) => {
        product.classList.add('product-wrapper');
        const newProduct = generateProduct(removeOtherAttributes(product));
        const host = product.getAttribute('data-host');
        if (host === currentHostType) {
          newProduct.classList.add(backgroundColorMap.get(host).light);
        } else {
          // eslint-disable-next-line no-lonely-if
          if (isEditMode) {
            newProduct.classList.add(backgroundColorMap.get(host).light);
          } else {
            newProduct.classList.add('hide');
          }
        }
        bottomWrapperEl.appendChild(newProduct);
      });
    }
  }
  secondPartEl.appendChild(topWrapperEl);
  secondPartEl.appendChild(bottomWrapperEl);
  block.appendChild(secondPartEl);

  const hostButtonList = topWrapperEl.querySelector('.host-button-wrapper');
  if (hostButtonList?.children?.length) {
    [...hostButtonList.children].forEach((btnEl) => {
      btnEl.addEventListener('click', () => {
        const hostType = btnEl.getAttribute('data-host');
        if (currentHostType === hostType) return;
        const allButtonEl = hostButtonList.querySelectorAll('.button-wrapper');
        allButtonEl.forEach((button) => {
          const buttonHostType = button.getAttribute('data-host');
          button.classList.remove(backgroundColorMap.get(buttonHostType).active);
        });
        currentHostType = hostType;
        btnEl.classList.add(backgroundColorMap.get(hostType).active);
        secondPartEl.className = `second-part ${backgroundColorMap.get(hostType).dark}`;
        const productList = bottomWrapperEl.querySelectorAll('.product-wrapper');
        setProductByHostType(productList, hostType, isEditMode);
      });
    });
  }

  const handleCardClick = (e) => {
    const cardLink = e.currentTarget.querySelector('a')?.href ?? null;
    if (!cardLink) return;
    window.location.href = cardLink;
  };

  const meidaCardQuery = window.matchMedia('(min-width: 860px)');

  const handleCardMediaChange = (e) => {
    const cardList = block.querySelectorAll('.product-wrapper');
    [...cardList].forEach((card) => {
      if (e.matches) { // PC
        card.removeEventListener('click', handleCardClick);
      } else { // Mobile
        card.addEventListener('click', handleCardClick);
      }
    });
  };

  handleCardMediaChange(meidaCardQuery); // 初始调用一次
  meidaCardQuery.addEventListener('change', handleCardMediaChange);
}
