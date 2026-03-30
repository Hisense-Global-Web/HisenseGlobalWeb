import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { handleCommonDownloadClick } from '../../utils/download.js';

const ETextAreaStyle = Object.freeze({
  green20: 'green20',
  transparentDark: 'transparentDark',
  transparentLight: 'transparentLight',
});

const generateTextArea = (itemEl, textAreaStyleEl, buyNowEl, downloadEl) => {
  if (itemEl.querySelector('picture')) itemEl.className = 'card-image';
  else {
    const textAreaStyle = textAreaStyleEl?.querySelector?.('p')?.textContent ?? ETextAreaStyle.green20;
    textAreaStyleEl?.remove();
    itemEl.classList.add('card-body');
    const topEl = document.createElement('div');
    topEl.append(...itemEl.children);
    // 设置背景色
    switch (textAreaStyle) {
      case ETextAreaStyle.transparentDark:
        itemEl.classList.add('transparent-dark');
        break;
      case ETextAreaStyle.transparentLight:
        itemEl.classList.add('transparent-light');
        break;
      default:
        itemEl.classList.add('green20');
        break;
    }
    itemEl.appendChild(topEl);
    const bottomEl = document.createElement('div');
    bottomEl.className = 'bottom-wrapper';

    // 构建Buy Now 按钮
    if (buyNowEl?.children?.length) {
      const buyNowWrapper = document.createElement('div');
      buyNowWrapper.className = 'buy-now';
      buyNowWrapper.textContent = buyNowEl.querySelector('p')?.textContent ?? 'Buy Now';
      const btnLink = buyNowEl.querySelector('a')?.href ?? '';
      buyNowWrapper.addEventListener('click', () => {
        if (btnLink?.length) {
          window.location.href = btnLink;
        }
      });
      bottomEl.appendChild(buyNowWrapper);
      buyNowEl.remove();
    } else {
      buyNowEl?.remove();
    }

    // 构建download 按钮
    if (downloadEl?.children?.length) {
      const [iconEl, linkEl] = downloadEl.children;
      const downloadWrapper = document.createElement('div');
      downloadWrapper.className = 'download';
      let btnLink = '';
      let isImg = false;
      if (linkEl?.querySelector('img')) {
        btnLink = linkEl.querySelector('img').src;
        isImg = true;
      } else {
        btnLink = linkEl?.querySelector('a')?.href;
      }
      const handleDownload = () => {
        if (isImg) {
          const link = document.createElement('a');
          link.href = btnLink;
          const noParamsUrl = btnLink?.split('?')?.[0] ?? '';
          link.download = noParamsUrl.substring(btnLink.lastIndexOf('/') + 1);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          handleCommonDownloadClick(btnLink);
        }
      };
      downloadWrapper.appendChild(iconEl);
      downloadWrapper.addEventListener('click', handleDownload);
      bottomEl.appendChild(downloadWrapper);
      downloadEl?.remove();
    }
    if (bottomEl?.children?.length) {
      itemEl.appendChild(bottomEl);
    }
  }
};

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('div');
  ul.classList.add('card-list');
  const title = document.createElement('div');
  [...block.children].forEach((row, i) => {
    if (i < 1) {
      // title有值则加载
      if (row?.querySelectorAll('p')?.length) {
        title.classList = 'title';
        title.append(...row.children);
      }
    } else {
      const li = document.createElement('div');
      li.classList.add('card-item');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      const [item1El, item2El, textAreaStyleEl, buyNowEl, DownloadEl] = li?.children ?? [];
      generateTextArea(item1El, textAreaStyleEl, buyNowEl, DownloadEl);
      generateTextArea(item2El, textAreaStyleEl, buyNowEl, DownloadEl);

      ul.append(li);
    }
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(title, ul);
}
