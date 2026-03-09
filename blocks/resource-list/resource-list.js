import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { validateEmail } from '../../utils/carousel-common.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || '';

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
      imgEl.src = `/content/dam/hisense/${country}/common-icons/close-70.svg`;
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
