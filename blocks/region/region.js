export default async function decorate(block) {
  const regionList = document.createElement('div');
  regionList.className = 'region-list';
  [...block.children].forEach((row, index) => {
    if (!index) {
      row.className = 'region-title';
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
