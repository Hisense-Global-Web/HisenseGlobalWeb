export default function decorate(block) {
  try {
    const isCenter = true;
    // const [textStyleP, titleP, subtitleP] = block.querySelectorAll('p');
    // titleP.classList.add('support-module-title-title');
    // if (isCenter) {
    //   titleP.classList.add('text-center');
    // }
    // // If subtitle exists
    // if (subtitleP) {
    //   // Check if subtitle is empty
    //   if (subtitleP?.innerHTML?.trim() === '') {
    //     subtitleP.remove();
    //   } else {
    //     subtitleP.classList.add('support-module-title-subtitle');
    //     if (isCenter) {
    //       subtitleP.classList.add('text-center');
    //     }
    //   }
    // }
    // textStyleP?.remove();
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Section Title block decoration error:', error);
  }
}
