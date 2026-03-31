import { readBlockConfig } from '../../scripts/aem.js';
import { isUniversalEditor } from '../../utils/ue-helper.js';

function getPrevTab(step) {
  let prev = step.previousElementSibling;
  while (prev) {
    if (prev.classList.contains('tab')) {
      return prev;
    }
    prev = prev.previousElementSibling;
  }
  return null;
}

export default function decorate(block) {
  const config = readBlockConfig(block);
  console.log(config);
  
  // [...block.children].forEach((child) => {
  //   if (Object.keys(config).includes(child.firstElementChild?.textContent.trim().toLowerCase())) {
  //     child.className = child.firstElementChild?.textContent.trim();
  //     child.firstElementChild.remove();
  //   }
  // });

  // if(!isUniversalEditor()) {
  //   // Add class to step based on previous tab
  //   const steps = block.querySelectorAll('.step');
  //   const stepCounter = {};
  //   steps.forEach((step) => {
  //     const prevTab = getPrevTab(step);
  //     if (prevTab) {
  //       const tabName = prevTab.firstElementChild.textContent.trim();
  //       stepCounter[tabName] = (stepCounter[tabName] || 0) + 1;
  //       step.setAttribute('data-tab', tabName);
  //     }
  //     step.firstElementChild.classList.add('step-image');
  //     const textContent = document.createElement('div');
  //     textContent.className = 'text-content';
  //     textContent.innerHTML = `
  //     <div class="step-number">${stepCounter[prevTab.firstElementChild.textContent.trim()] || ''}</div>`;
  //     step.lastElementChild.classList.add('step-description');
  //     textContent.appendChild(step.lastElementChild);
  //     step.append(textContent);
  //   });
  //   // Create tab container and move tabs into it
  //   const tabs = block.querySelectorAll('.tab');
  //   const tabContainers = document.createElement('div');
  //   tabContainers.className = 'tab-container';
  
  //   block.appendChild(tabContainers);
  //   tabs.forEach((tab) => {
  //     const tabTitle = tab.firstElementChild.textContent.trim();
  //     const stepGroups = document.createElement('div');
  //     stepGroups.className = 'step-groups';
  //     const tabDescriptionContainer = document.createElement('div');
  //     tabDescriptionContainer.className = 'tab-description';
  //     const relatedSteps = block.querySelectorAll(`.step[data-tab="${tabTitle}"]`);
  //     relatedSteps.forEach((step) => {
  //       stepGroups.appendChild(step);
  //     });
  //     stepGroups.dataset.tab = tabTitle;
  
  //     tabDescriptionContainer.appendChild(tab.lastElementChild);
  //     tabDescriptionContainer.dataset.tab = tabTitle;
  //     tabContainers.appendChild(tab);
  //     tab.addEventListener('click', () => {
  //       tabs.forEach((t) => t.classList.remove('active'));
  //       block.querySelectorAll('.step-groups').forEach((sg) => sg.classList.remove('active'));
  //       block.querySelectorAll('.tab-description').forEach((td) => td.classList.remove('active'));
  //       tab.classList.add('active');
  //       block.querySelectorAll(`.tab-description[data-tab="${tabTitle}"]`).forEach((td) => td.classList.add('active'));
  //       block.querySelectorAll(`.step-groups[data-tab="${tabTitle}"]`).forEach((sg) => sg.classList.add('active'));
  //     });
  //     tabs[0].click();
  //     block.appendChild(tabDescriptionContainer);
  //     block.appendChild(stepGroups);
  //   });
  // }
}
