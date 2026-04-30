import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  console.log('config', config);
  // const [leabel1El, placeholder1El, label2El, placeholder2El, buttonTextEl, noResultEl, ...cityListEl] = [...block.children] ?? []
  // const bottomWrapperEl = document.createElement('div');
  // bottomWrapperEl.className = 'bottom-wrapper';

  // if (cityListEl?.length) {
  //   const cityList = [];
  //   cityList.forEach((cityEl) => {
  //     const [tagEl, cityNameEl, storeNameEl, label1El] = [...cityEl.children] ?? [];
  //   });
  // }
}
