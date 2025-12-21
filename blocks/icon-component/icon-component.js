// const index = 0;

// function getSlideWidth(block) {
//   const singleItem = block.querySelector('li');
//   const cardWidth = singleItem.offsetWidth;
//   const gap = 24;
//   return cardWidth + gap;
// }
//
// function updatePosition(block, visibleCards) {
//   const track = block.querySelector('.icon-track');
//   const items = block.querySelectorAll('li');
//   const moveDistance = index * getSlideWidth(block);
//
//   track.style.transform = `translateX(-${moveDistance}px)`;
//   block.querySelector('.slide-prev').disabled = (index === 0);
//   block.querySelector('.slide-next').disabled = (index >= items.length - visibleCards);
// }
//
// function bindEvent(block, visibleCards) {
//   const cards = block.querySelectorAll('.item');
//   cards.forEach((card) => {
//     const link = card.querySelector('a');
//     const url = link?.href;
//     card.addEventListener('click', () => {
//       if (url) window.location.href = url;
//     });
//   });
//   // prev and next button
//   block.querySelector('.slide-prev').addEventListener('click', () => {
//     if (index > 0) {
//       index -= 1;
//       updatePosition(block, visibleCards);
//     }
//   });
//   block.querySelector('.slide-next').addEventListener('click', () => {
//     if (index < cards.length - visibleCards) {
//       index += 1;
//       updatePosition(block, visibleCards);
//     }
//   });
// }

export default async function decorate(block) {
  const iconContainer = document.createElement('div');
  iconContainer.classList.add('icon-viewport');
  const iconBlocks = document.createElement('ul');
  iconBlocks.classList.add('icon-track');
  console.log(block, 'block');
  // [...block.firstElementChild.children].forEach((child) => {
  //   const iconBlock = document.createElement('li');
  //   child.classList.add('item');
  //   [...child.children].forEach((item) => {
  //     if (item.querySelector('picture')) {
  //       item.querySelector('picture').closest('div').classList.add('item-picture');
  //     }
  //     if (item.querySelector('.button-container')) {
  //       item.querySelector('.button-container').closest('div').classList.add('item-cta');
  //       if (block.classList.contains('text-left')) {
  //         item.querySelector('.button-container').closest('div').classList.add('show');
  //       }
  //     }
  //     if (!item.innerHTML) item.remove();
  //   });
  //   iconBlock.appendChild(child);
  //   iconBlocks.appendChild(iconBlock);
  // });
  // iconContainer.appendChild(iconBlocks);
  // block.appendChild(iconContainer);
  //
  // // load controls
  // if (iconBlocks.scrollWidth >= iconContainer.offsetWidth) {
  //   const buttonContainer = document.createElement('div');
  //   buttonContainer.classList.add('pagination');
  //   buttonContainer.innerHTML = `
  //     <button type="button" class="slide-prev" disabled></button>
  //     <button type="button" class="slide-next"></button>
  //   `;
  //   block.appendChild(buttonContainer);
  // }
  //
  // const visibleCards = iconBlocks.offsetWidth / iconBlocks.querySelector('li').offsetWidth;
  // bindEvent(block, visibleCards);
  // window.addEventListener('resize', updatePosition);
}
