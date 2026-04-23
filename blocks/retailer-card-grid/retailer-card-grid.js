export default async function decorate(block) {
  const retailerBoxEl = document.createElement('div');
  retailerBoxEl.className = 'retailer-box';
  [...block.children].forEach((item, index) => {
    if (index === 0) {
      item.className = 'retailer-tit';
    } else {
      item.className = 'retailer-item';
      const allPEl = item.querySelectorAll('p');
      allPEl.forEach((subItem, subIndex) => {
        if (subIndex === 0) {
          subItem.className = 'retailer-logo';
        } else {
          subItem.classList.add('retailer-btn');
        }
      });
      retailerBoxEl.append(item);
    }
  });
  block.append(retailerBoxEl);
}
