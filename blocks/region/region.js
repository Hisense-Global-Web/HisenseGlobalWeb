import { getLocaleFromPath } from '../../scripts/locale-utils.js';

const { country } = getLocaleFromPath();
const ARROW_ICON = `${window.GRAPHQL_BASE_URL}/content/dam/hisense/${country}/common-icons/chevron-up.svg`;
export default async function decorate(block) {
  const regionList = document.createElement('div');
  regionList.className = 'region-list';
  [...block.children].forEach((row, index) => {
    if (!index) {
      row.className = 'region-title';
      const arrow = document.createElement('img');
      arrow.classList.add('region-title-arrow');
      arrow.src = ARROW_ICON;
      arrow.alt = '';
      arrow.addEventListener('click', (e) => {
        e.currentTarget.closest('.region').classList.toggle('hide');
      });
      row.appendChild(arrow);
    } else {
      row.className = 'region-country';
      regionList.appendChild(row);
      const countryTitle = row.children[0].textContent.trim();
      row.children[0].style.display = 'none';
      const countryLink = row.children[1].querySelector('a').href;
      row.children[1].style.display = 'none';
      const countryEl = document.createElement('div');
      countryEl.className = 'country-item';
      countryEl.textContent = countryTitle;
      countryEl.addEventListener('click', () => {
        window.location.href = countryLink;
      });
      row.appendChild(countryEl);
    }
  });
  block.appendChild(regionList);
}
