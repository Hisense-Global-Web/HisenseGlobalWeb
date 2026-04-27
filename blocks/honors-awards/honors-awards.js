import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function syncHorizontalSection(block) {
  const section = block.closest('.section');
  if (!section) return;

  const wrappers = [...section.querySelectorAll('.honors-awards-wrapper')]
    .filter((wrapper) => wrapper.closest('.section') === section);

  if (!wrappers.length) return;

  let horizontalSection = section.querySelector(':scope > .horizontal-section');
  if (!horizontalSection) {
    horizontalSection = document.createElement('div');
    horizontalSection.className = 'horizontal-section';
    wrappers[0].before(horizontalSection);
  } else if (wrappers[0].parentElement !== horizontalSection) {
    wrappers[0].before(horizontalSection);
  }

  wrappers.forEach((wrapper) => horizontalSection.append(wrapper));

  [...section.querySelectorAll(':scope > .horizontal-section')]
    .filter((group) => group !== horizontalSection)
    .forEach((group) => {
      [...group.querySelectorAll(':scope > .honors-awards-wrapper')]
        .forEach((wrapper) => horizontalSection.append(wrapper));
      group.remove();
    });
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('div');
  ul.className = 'honors-awards-content';
  const title = document.createElement('div');
  [...block.children].forEach((row, i) => {
    if (i === 0) {
      title.className = 'title';
      title.append(...row.children);
    } else {
      const li = document.createElement('div');
      li.classList.add('card-item');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.querySelector('picture')) div.className = 'card-image';
        else {
          div.className = 'card-body';
          const { children } = div;
          const { length } = children;
          if (length > 0) {
            const tit = document.createElement('div');
            const desc = document.createElement('div');
            tit.append(children[0]);
            if (length > 1) {
              desc.append(children[children.length - 1]);
            }
            div.replaceChildren(tit, desc);
          }
        }
      });
      ul.append(li);
    }
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(title, ul);
  syncHorizontalSection(block);
  block.classList.add('loaded');
}
