import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { validateEmail } from '../../utils/carousel-common.js';

const DEFAULT_ICON_SVG = '<svg width="80" height="80" viewBox="0 0 80 80" fill="none" '
  + 'xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M64 26V15C64 12.7909 62.2091 11 60 11H20C17.7909 11 16 12.7909 16 15V17" '
  + 'stroke="#009E9B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  + '<path d="M63.2 68C64.7383 68 66.2135 67.4072 67.3012 66.352C68.3889 65.2968 69 63.8657 '
  + '69 62.3734V38.0665C69 36.5742 68.3889 35.1431 67.3012 34.0879C66.2135 33.0327 64.7383 '
  + '32.4399 63.2 32.4399H40.29C39.32 32.4491 38.3631 32.2222 37.5069 31.7798C36.6507 31.3375 '
  + '35.9225 30.6939 35.389 29.9079L33.04 26.532C32.5119 25.754 31.7929 25.1154 30.9476 '
  + '24.6735C30.1024 24.2316 29.1572 24.0002 28.197 24H16.8C15.2617 24 13.7865 24.5928 '
  + '12.6988 25.648C11.6111 26.7032 11 28.1343 11 29.6266V62.3734C11 63.8657 11.6111 65.2968 '
  + '12.6988 66.352C13.7865 67.4072 15.2617 68 16.8 68H63.2Z" '
  + 'stroke="#009E9B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  + '</svg>';

export default function decorate(block) {
  const container = document.createElement('div');
  container.className = 'resource-list-container';

  const rows = [...block.children];

  rows.forEach((row) => {
    if (row.children.length < 2) return;

    const card = document.createElement('div');
    card.className = 'resource-card';
    moveInstrumentation(row, card);

    const cells = [...row.children];
    console.log([...cells]);
    const iconCell = cells[0];
    const title = cells[1]?.textContent.trim() || '';
    const description = cells[2]?.textContent.trim() || '';
    const subTitle = cells[3]?.textContent.trim() || '';
    const textContent = cells[4]?.innerHTML || '';
    const buttonText = cells[5]?.textContent.trim() || '';
    const buttonLink = cells[6]?.querySelector('a')?.href || '';
    const downloadAsset = cells[7]?.querySelector('a')?.href || cells[4]?.textContent.trim() || '';
    const cardType = cells[8]?.textContent.trim() || 'download';

    card.setAttribute('data-card-type', cardType);

    // Icon
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'resource-icon';

    const iconImg = iconCell?.querySelector('img');
    if (iconImg) {
      const picture = createOptimizedPicture(
        iconImg.src,
        iconImg.alt || 'Resource icon',
        false,
        [{ width: '80' }],
      );
      iconWrapper.appendChild(picture);
    } else {
      iconWrapper.innerHTML = DEFAULT_ICON_SVG;
    }
    card.appendChild(iconWrapper);

    if (title) {
      const contentEl = document.createElement('div');
      contentEl.className = 'resource-title';
      contentEl.innerHTML = title;
      card.appendChild(contentEl);
    }
    if (description) {
      const contentEl = document.createElement('div');
      contentEl.className = 'resource-description';
      contentEl.innerHTML = description;
      card.appendChild(contentEl);
    }
    if (subTitle) {
      const contentEl = document.createElement('div');
      contentEl.className = 'resource-subtitle';
      contentEl.innerHTML = subTitle;
      card.appendChild(contentEl);
    }

    // Content (rich text with H2-H6 headings)
    if (textContent) {
      const contentEl = document.createElement('div');
      contentEl.className = 'resource-content';
      contentEl.innerHTML = textContent;
      card.appendChild(contentEl);
    }

    // Subscribe form (only for subscribe type)
    if (cardType === 'subscribe') {
      const formEl = document.createElement('div');
      formEl.className = 'resource-subscribe-form';

      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.placeholder = 'your@email.com';
      inputEl.className = 'resource-email-input';
      inputEl.required = true;
      inputEl.addEventListener('input', (e) => {
        e.currentTarget.parentNode.classList.remove('error');
      });

      const clearEl = document.createElement('span');
      clearEl.className = 'clear-icon';
      const imgEl = document.createElement('img');
      imgEl.src = '/content/dam/hisense/us/common-icons/close-70.svg';
      clearEl.appendChild(imgEl);
      clearEl.addEventListener('click', (e) => {
        const targetInputEl = e.currentTarget.parentNode.querySelector('input');
        targetInputEl.value = '';
        targetInputEl.focus();
      });

      const errorEl = document.createElement('span');
      errorEl.className = 'error-tip';
      errorEl.innerHTML = '请输入正确的邮箱';

      formEl.append(inputEl, clearEl, errorEl);
      card.appendChild(formEl);
    }

    // Button
    if (buttonText) {
      const btnEl = document.createElement('a');
      btnEl.className = 'resource-button';
      btnEl.textContent = buttonText;

      if (cardType === 'download' && downloadAsset) {
        btnEl.href = downloadAsset;
        btnEl.download = '';
      } else if (buttonLink) {
        btnEl.href = buttonLink;
      } else {
        btnEl.href = '#';
      }

      if (cardType === 'subscribe') {
        btnEl.addEventListener('click', (e) => {
          e.preventDefault();
          const form = card.querySelector('.resource-subscribe-form');
          const input = form?.querySelector('input.resource-email-input');
          if (input && input.value) {
            // Handle subscription
            if (validateEmail(input.value)) {
              // eslint-disable-next-line no-console
              console.log('Subscribe:', input.value);
              input.value = '';
            } else {
              form.classList.add('error');
            }
          } else {
            input?.reportValidity();
          }
        });
      }

      card.appendChild(btnEl);
    }

    container.appendChild(card);
  });

  block.replaceChildren(container);
}
