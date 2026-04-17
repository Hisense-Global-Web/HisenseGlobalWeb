const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';
const DEFAULT_EMPTY_MESSAGE = '';
const DEFAULT_ERROR_MESSAGE = 'Unable to load product specifications';

function createProductSpecificationsMessage(text, className = 'product-specifications-empty') {
  const message = document.createElement('div');
  message.className = className;
  message.textContent = text;
  return message;
}

function buildSpecificationHierarchy(product = {}) {
  const specHierarchy = {};

  for (let i = 1; i <= 20; i += 1) {
    const labelKey = `specificationsGroup${i}Label`;
    const attrKey = `specificationsGroup${i}Attribute`;

    if (product[labelKey] && Array.isArray(product[attrKey])) {
      const fullLabel = product[labelKey];
      const attributes = product[attrKey]
        .filter((attr) => typeof attr === 'string')
        .map((attr) => attr.trim())
        .filter((attr) => attr && attr.includes('::'));

      if (attributes.length) {
        let level1 = '';
        let level2 = '';

        if (fullLabel.includes('-')) {
          const parts = fullLabel.split('-', 2);
          level1 = parts[0].trim();
          level2 = parts[1].trim();
        } else {
          level1 = fullLabel;
        }

        if (!level2) {
          level2 = level1;
          level1 = 'Specifications';
        }

        if (!specHierarchy[level1]) {
          specHierarchy[level1] = {};
        }
        if (!specHierarchy[level1][level2]) {
          specHierarchy[level1][level2] = [];
        }

        specHierarchy[level1][level2].push(...attributes);
      }
    }
  }

  return specHierarchy;
}

function countSpecificationGroups(specHierarchy = {}) {
  return Object.values(specHierarchy).reduce(
    (sum, level2Obj) => sum + Object.values(level2Obj).filter((attributes) => attributes.length > 0).length,
    0,
  );
}

export default async function decorate(block) {
  // 等待数据加载
  const waitForProductData = () => new Promise((resolve) => {
    const checkProduct = () => {
      if (window.currentProduct) {
        resolve(window.currentProduct);
      } else {
        setTimeout(checkProduct, 300);
      }
    };
    checkProduct();
  });

  try {
    const product = await waitForProductData();

    const specHierarchy = buildSpecificationHierarchy(product);
    const totalGroupCount = countSpecificationGroups(specHierarchy);

    if (!totalGroupCount) {
      block.replaceChildren(createProductSpecificationsMessage(DEFAULT_EMPTY_MESSAGE));
      return;
    }

    // 创建包装器容
    const wrapper = document.createElement('div');
    wrapper.className = 'product-specifications-wrapper';

    // 创建block容器
    const container = document.createElement('div');
    container.className = 'product-specifications block';
    container.setAttribute('data-block-name', 'product-specifications');
    container.setAttribute('data-block-status', 'loaded');

    // 创建properties结构
    let totalGroups = 0;
    const level1Keys = Object.keys(specHierarchy);

    level1Keys.forEach((level1) => {
      // 创建一级分类标题
      const titleWrapper = document.createElement('div');
      titleWrapper.className = 'default-content-wrapper';
      const title = document.createElement('h3');
      title.id = 'specifications';
      title.textContent = level1;
      titleWrapper.appendChild(title);
      container.appendChild(titleWrapper);

      const level2Groups = specHierarchy[level1];

      Object.keys(level2Groups).forEach((level2) => {
        const attributes = level2Groups[level2];

        if (attributes.length > 0) {
          const propertiesWrapper = document.createElement('div');
          propertiesWrapper.className = 'properties-wrapper';

          const propertiesBlock = document.createElement('div');
          propertiesBlock.className = 'properties block';

          // 计算索引用于first和last
          const globalIndex = totalGroups;

          // 添加全局first和last
          if (globalIndex === 0) {
            propertiesBlock.classList.add('first');
          }
          if (globalIndex === totalGroupCount - 1) {
            propertiesBlock.classList.add('last');
          }

          // 创建header
          const headerButton = document.createElement('button');
          headerButton.className = 'properties-header';

          const headerTitle = document.createElement('h3');
          headerTitle.className = 'properties-header-title';
          headerTitle.textContent = level2; // 二级标题

          const headerIcon = document.createElement('span');
          headerIcon.className = 'properties-header-icon';
          const iconImg = document.createElement('img');
          iconImg.src = `/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
          iconImg.setAttribute('aria-hidden', 'true');
          iconImg.loading = 'lazy';
          headerIcon.appendChild(iconImg);

          headerButton.appendChild(headerTitle);
          headerButton.appendChild(headerIcon);

          // 创建content
          const content = document.createElement('div');
          content.className = 'properties-content';

          // 创建attributes并创建property
          attributes.forEach((attr) => {
            if (attr && attr.includes('::')) {
              const [name, value] = attr.split('::', 2);

              const property = document.createElement('div');
              property.className = 'property';

              const propertyName = document.createElement('div');
              propertyName.className = 'property-name';
              const nameP = document.createElement('p');
              nameP.textContent = name;
              propertyName.appendChild(nameP);

              const propertyValue = document.createElement('div');
              const valueP = document.createElement('p');
              valueP.textContent = value;
              propertyValue.appendChild(valueP);

              property.appendChild(propertyName);
              property.appendChild(propertyValue);
              content.appendChild(property);
            }
          });

          propertiesBlock.appendChild(headerButton);
          propertiesBlock.appendChild(content);
          propertiesWrapper.appendChild(propertiesBlock);
          container.appendChild(propertiesWrapper);
          const divideLineEl = document.createElement('div');
          const divideLineInnerEl = document.createElement('div');
          divideLineEl.appendChild(divideLineInnerEl);
          divideLineEl.classList.add('divide-line');
          if (globalIndex !== totalGroupCount - 1) {
            container.appendChild(divideLineEl);
          }

          // 添加点击事件
          headerButton.addEventListener('click', () => {
            propertiesBlock.classList.toggle('expanded');
          });

          if (globalIndex === 0) {
            propertiesBlock.classList.add('expanded');
          }

          totalGroups += 1;
        }
      });
    });

    wrapper.appendChild(container);
    block.replaceChildren(wrapper);

    setTimeout(() => {
      const allContents = block.querySelectorAll('.properties-content');
      allContents.forEach((content) => {
        const contentHeight = content.scrollHeight;
        content.style.maxHeight = `${contentHeight}px`;
      });
    }, 200);
  } catch (error) {
    // 加载失败，显示错误信息
    block.replaceChildren(createProductSpecificationsMessage(
      DEFAULT_ERROR_MESSAGE,
      'product-specifications-error',
    ));
  }
}
