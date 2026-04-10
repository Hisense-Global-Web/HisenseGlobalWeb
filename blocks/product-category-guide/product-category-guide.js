import { readBlockConfig } from '../../scripts/aem.js';
// for author display only, no interaction, so no need to consider click event and content display toggle for different tabs. Just display all steps in order, and add class name to each step based on the previous tab.
export default function decorate(block) {
  const config = readBlockConfig(block);

  [...block.children].forEach((child) => {
    if (Object.keys(config).includes(child.firstElementChild?.textContent.trim().toLowerCase())) {
      child.className = child.firstElementChild?.textContent.trim();
      child.firstElementChild.remove();
    }
  });

  // Add class to step based on previous tab
  if (block.querySelector('.step')) {
    const steps = block.querySelectorAll('.step');
    const stepGroups = document.createElement('div');
    stepGroups.className = 'step-groups';
    steps.forEach((step, index) => {
      step.firstElementChild.classList.add('step-image');
      const textContent = document.createElement('div');
      textContent.className = 'text-content';
      if (step.lastElementChild.textContent.trim()) {
        textContent.innerHTML = `
        <div class="step-number">
          <span class="step-number-text">${index + 1}</span>
        </div>`;
      }
      step.lastElementChild.classList.add('step-description');
      textContent.appendChild(step.lastElementChild);
      step.append(textContent);
      stepGroups.appendChild(step);
    });

    block.appendChild(stepGroups);
  }

  // block.dataset.tab = block.querySelector('.category-tab')?.firstElementChild.textContent.trim() || '';
}
