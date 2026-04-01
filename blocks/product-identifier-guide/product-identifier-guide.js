import { isUniversalEditor } from '../../utils/ue-helper.js';

export default function decorate(block) {
  const titleDom = document.createElement('div');
  titleDom.className = 'guide-title';
  titleDom.innerHTML = block.dataset.title || '';
  block.prepend(titleDom);

  if (isUniversalEditor()) return;
  const tabs = document.createElement('div');
  tabs.className = 'category-tabs';
  const steps = document.createElement('div');
  steps.className = 'guide-steps';
  const descriptions = document.createElement('div');
  descriptions.className = 'descriptions';

  [...block.children].forEach((child, c) => {
    if (c === 0) return;
    const childBlock = child.firstElementChild;

    [...childBlock.children].forEach((grandChild, g) => {
      grandChild.className = grandChild.firstElementChild?.textContent.trim();
      grandChild.firstElementChild.remove();

      if (grandChild.className === 'category-tab') {
        tabs.appendChild(grandChild);
      } else if (grandChild.className === 'category-description') {
        grandChild.dataset.tab = c;
        descriptions.appendChild(grandChild);
      } else {
        grandChild.dataset.tab = c;
        steps.appendChild(grandChild);
      }
    });
  });
  block.replaceChildren(titleDom, tabs, descriptions, steps);

  // Add click event listener to tabs
  const tabElements = block.querySelectorAll('.category-tab');
  const descriptionElements = block.querySelectorAll('.category-description');
  const stepElements = block.querySelectorAll('.guide-steps > div');
  const stepCounter = {};

  tabElements.forEach((tab, ti) => {
    tab.addEventListener('click', () => {
      const selectedTabNumber = ti + 1; // Assuming tab numbers start from 1
      // Update active tab
      tabElements.forEach((t) => {
        if (t === tab) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
      // Show corresponding description and steps
      descriptionElements.forEach((desc) => {
        if (desc.dataset.tab === String(selectedTabNumber)) {
          desc.classList.add('active');
        } else {
          desc.classList.remove('active');
        }
      });

      stepElements.forEach((step) => {
        if (step.dataset.tab === String(selectedTabNumber)) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });

      if (window.innerWidth < 860) {
        const activeStep = block.querySelector('.guide-steps > div.active');
        if (activeStep) {
          activeStep.scrollIntoView({ behavior: 'instant', inline: 'center' });
        }

        const activeTab = block.querySelector('.category-tab.active');
        if (activeTab) {
          activeTab.scrollIntoView({ behavior: 'instant', inline: 'center' });
        }
      }
    });
  });

  stepElements.forEach((step) => {
    stepCounter[step.dataset.tab] = (stepCounter[step.dataset.tab] || 0) + 1;
    step.firstElementChild.classList.add('step-image');
    const textContent = document.createElement('div');
    textContent.className = 'text-content';
    textContent.innerHTML = `
    <div class="step-number"><span class="step-number-text">${stepCounter[step.dataset.tab] || 1}</span></div>`;
    step.lastElementChild.classList.add('step-description');
    textContent.appendChild(step.lastElementChild);
    step.append(textContent);
  });

  // Activate the first tab by default
  if (tabElements.length > 0) {
    tabElements[0].click();
  }
}
