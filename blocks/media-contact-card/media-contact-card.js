import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  const config = readBlockConfig(block);
  [...block.children].forEach((row) => {
    if (row.children[0].textContent?.trim() === 'title') {
      row.style.display = 'none';
      return;
    }
    row.classList.add('media-contact-card-item');
    const textGroupEl = document.createElement('div');
    textGroupEl.classList.add('media-contact-card-text-group');
    const btnGroupEl = document.createElement('div');
    btnGroupEl.classList.add('media-contact-card-group');
    [...row.children].forEach((child, i) => {
      if (i === 0) {
        child.classList.add('media-contact-card-text-title');
        textGroupEl.append(child);
      } else if (i === 1) {
        child.classList.add('media-contact-card-text-content');
        textGroupEl.append(child);
      } else if (i === 2) {
        const emailEl = document.createElement('div');
        emailEl.classList.add('media-contact-card-text-email');
        emailEl.append(child);
        textGroupEl.append(emailEl);
      } else if (i === 3) {
        const emailEl = textGroupEl.querySelector('.media-contact-card-text-email');
        if (emailEl) {
          emailEl.append(child);
        }
      } else if (i === 4) {
        const btnEl = document.createElement('div');
        btnEl.classList.add('media-contact-card-btn');
        btnEl.innerHTML = child.textContent.trim();
        btnGroupEl.append(btnEl);
        child.remove();
      } else if (i === 5) {
        const btnEl = btnGroupEl.querySelector('.media-contact-card-btn');
        if (btnEl && child.textContent.trim()) {
          btnEl.addEventListener('click', () => {
            window.location.href = child.textContent.trim();
          });
        }
        child.remove();
      } else if (i === 6) {
        if (child.textContent.trim()) {
          const descriptionEl = document.createElement('div');
          descriptionEl.classList.add('media-contact-card-description');
          descriptionEl.innerHTML = child.textContent.trim();
          btnGroupEl.append(descriptionEl);
        }
        child.remove();
      }
    });
    row.appendChild(textGroupEl);
    row.appendChild(btnGroupEl);
  });

  if (config.title) {
    let titleEl = block.parentNode.querySelector('.media-contact-card-title');
    if (!titleEl) {
      titleEl = document.createElement('div');
      titleEl.classList.add('media-contact-card-title');
      block.parentNode.prepend(titleEl);
    }
    titleEl.innerHTML = config.title;
  }
}
