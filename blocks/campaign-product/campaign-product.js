export default function decorate(block) {
  console.log(block);
  const data = [];
  [...block.children].forEach((row) => {
    row.classList.add('campaign-category');
    const category = {
      name: '',
      src: '',
      products: [],
    };
    [...row.children].forEach((item, index) => {
      if (index === 0) {
        const imgEl = item.querySelector('img');
        category.src = imgEl?.src;
      } else if (index === 1) {
        category.name = item.textContent.trim();
      } else if (index === 2) {
        
      }
    });
    data.push(category);
    console.log(data);
  });
}
