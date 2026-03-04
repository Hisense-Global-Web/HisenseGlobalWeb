import { readBlockConfig } from '../../scripts/aem.js';

const ARROW_LEFT_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path class="circle" d="M14 0.5C6.544 0.5 0.5 6.544 0.5 14C0.5 21.456 6.544 27.5 14 27.5C21.456 27.5 27.5 21.456 27.5 14C27.5 6.544 21.456 0.5 14 0.5Z" stroke="#BBBBBB"/>
  <path class="arrow" d="M16 8L10.743 12.774C10.333 13.146 10.304 13.781 10.678 14.189L16 20" stroke="#BBBBBB" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const ARROW_RIGHT_SVG = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path class="circle" d="M14 0.5C21.456 0.5 27.5 6.544 27.5 14C27.5 21.456 21.456 27.5 14 27.5C6.544 27.5 0.5 21.456 0.5 14C0.5 6.544 6.544 0.5 14 0.5Z" stroke="#009F9C"/>
  <path class="arrow" d="M12 8L17.257 12.774C17.667 13.146 17.696 13.781 17.322 14.189L12 20" stroke="#009F9C" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const VISIBLE_COUNT = 3;

function buildStaticContent() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="tabs-header">
      <ul class="tabs">
        <li class="tab active" type="documentation"><p>Documentation</p></li>
        <li class="tab" type="firmware"><p>Firmware</p></li>
        <li class="tab" type="warranty"><p>Warranty</p></li>
      </ul>
      <div class="carousel-nav" style="display:none;">
        <button class="carousel-prev disabled" aria-label="Previous">${ARROW_LEFT_SVG}</button>
        <button class="carousel-next" aria-label="Next">${ARROW_RIGHT_SVG}</button>
      </div>
    </div>
    <div class="tab-content-wrapper">
      <div class="tab-content active" type="documentation">
        <ul class="tab-content-ul">
          <li><div class="item">
            <div class="item-picture-container"><img class="item-picture" src="/resources/news-pagination-arrow.svg" alt="picture"></div>
            <p class="item-title">User Manual</p>
            <ul class="item-description">
              <li><span class="item-description-text">English • 156 pages</span></li>
              <li><span class="item-description-text">PDF • 12.4 MB</span></li>
            </ul>
            <a class="item-cta" href=""><span class="item-cta-text">Download</span></a>
          </div></li>
          <li><div class="item">
            <div class="item-picture-container"><img class="item-picture" src="/resources/news-pagination-arrow.svg" alt="picture"></div>
            <p class="item-title">Quick Start Guide</p>
            <ul class="item-description">
              <li><span class="item-description-text">English • 156 pages</span></li>
              <li><span class="item-description-text">PDF • 12.4 MB</span></li>
            </ul>
            <a class="item-cta" href=""><span class="item-cta-text">Download</span></a>
          </div></li>
          <li><div class="item">
            <div class="item-picture-container"><img class="item-picture" src="/resources/news-pagination-arrow.svg" alt="picture"></div>
            <p class="item-title">Installation Guide</p>
            <ul class="item-description">
              <li><span class="item-description-text">English • 24 pages</span></li>
              <li><span class="item-description-text">PDF • 3.2 MB</span></li>
            </ul>
            <a class="item-cta" href=""><span class="item-cta-text">Download</span></a>
          </div></li>
          <li><div class="item">
            <div class="item-picture-container"><img class="item-picture" src="/resources/news-pagination-arrow.svg" alt="picture"></div>
            <p class="item-title">Installation Guide</p>
            <ul class="item-description">
              <li><span class="item-description-text">English • 24 pages</span></li>
              <li><span class="item-description-text">PDF • 3.2 MB</span></li>
            </ul>
            <a class="item-cta" href=""><span class="item-cta-text">Download</span></a>
          </div></li>
          <li><div class="item">
            <div class="item-picture-container"><img class="item-picture" src="/resources/news-pagination-arrow.svg" alt="picture"></div>
            <p class="item-title">Installation Guide</p>
            <ul class="item-description">
              <li><span class="item-description-text">English • 24 pages</span></li>
              <li><span class="item-description-text">PDF • 3.2 MB</span></li>
            </ul>
            <a class="item-cta" href=""><span class="item-cta-text">Download</span></a>
          </div></li>
        </ul>
      </div>
      <div class="tab-content" type="firmware">
        <ul class="tab-content-ul">
          <li><div class="item">
            <div class="item-picture-container"><img class="item-picture" src="/resources/news-pagination-arrow.svg" alt="picture"></div>
            <p class="item-title">Find Latest Firmware Update</p>
            <a class="item-cta" href=""><span class="item-cta-text">Go to Firmware Download</span></a>
          </div></li>
        </ul>
      </div>
      <div class="tab-content" type="warranty">
        <ul class="tab-content-ul">
          <li><div class="item">
            <div class="item-picture-container"><img class="item-picture" src="/resources/news-pagination-arrow.svg" alt="picture"></div>
            <p class="item-title">Limited Warranty Coverage</p>
            <ul class="item-description">
              <li><img class="item-description-icon" src="/resources/clock-icon.svg" alt="icon"><span class="item-description-text">1 year parts and labor</span></li>
              <li><img class="item-description-icon" src="/resources/clock-icon.svg" alt="icon"><span class="item-description-text">1 year parts and labor</span></li>
            </ul>
            <div class="item-reminder"><p class="item-reminder-text">Warranty starts from original purchase date.</p></div>
          </div></li>
        </ul>
      </div>
    </div>`;
  return wrapper;
}

function initTabsAndCarousel(block) {
  const tabs = block.querySelectorAll('.tab');
  const tabContents = block.querySelectorAll('.tab-content');
  const carouselNav = block.querySelector('.carousel-nav');
  const prevBtn = block.querySelector('.carousel-prev');
  const nextBtn = block.querySelector('.carousel-next');
  let currentIndex = 0;

  function getActiveContent() {
    return block.querySelector('.tab-content.active');
  }

  function getTrack(content) {
    return content ? content.querySelector('.tab-content-ul') : null;
  }

  function getItems(content) {
    return content ? content.querySelectorAll('.tab-content-ul > li') : [];
  }

  function getItemWidth(content) {
    const items = getItems(content);
    if (items.length === 0) return 0;
    const firstItem = items[0].querySelector('.item');
    if (!firstItem) return 0;
    return firstItem.offsetWidth;
  }

  function getGap(content) {
    const track = getTrack(content);
    if (!track) return 24;
    return parseFloat(getComputedStyle(track).gap) || 24;
  }

  function getMaxIndex(content) {
    const items = getItems(content);
    const count = items.length;
    if (count <= VISIBLE_COUNT) return 0;
    return count - VISIBLE_COUNT;
  }

  function isMobile() {
    return window.innerWidth < 860;
  }

  function updateCarousel() {
    const content = getActiveContent();
    const track = getTrack(content);
    const items = getItems(content);
    const count = items.length;

    if (isMobile() || count <= VISIBLE_COUNT) {
      carouselNav.style.display = 'none';
      if (track) track.style.transform = 'translateX(0)';
      return;
    }

    carouselNav.style.display = 'flex';
    const itemW = getItemWidth(content);
    const gap = getGap(content);
    const offset = currentIndex * (itemW + gap);
    if (track) track.style.transform = `translateX(-${offset}px)`;

    const maxIdx = getMaxIndex(content);
    prevBtn.classList.toggle('disabled', currentIndex <= 0);
    nextBtn.classList.toggle('disabled', currentIndex >= maxIdx);
  }

  function switchTab(targetType) {
    tabs.forEach((t) => t.classList.toggle('active', t.getAttribute('type') === targetType));
    tabContents.forEach((c) => c.classList.toggle('active', c.getAttribute('type') === targetType));
    currentIndex = 0;
    updateCarousel();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('type'));
    });
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    const maxIdx = getMaxIndex(getActiveContent());
    if (currentIndex < maxIdx) {
      currentIndex += 1;
      updateCarousel();
    }
  });

  window.addEventListener('resize', () => updateCarousel());
  updateCarousel();
}

export default function decorate(block) {
  const config = readBlockConfig(block);
  const titleText = config.title || 'Resources';

  block.textContent = '';

  const titleEl = document.createElement('p');
  titleEl.className = 'title';
  titleEl.textContent = titleText;
  block.appendChild(titleEl);

  const staticContent = buildStaticContent();
  while (staticContent.firstChild) {
    block.appendChild(staticContent.firstChild);
  }

  initTabsAndCarousel(block);
  block.classList.add('loaded');
}
