import { readBlockConfig } from '../../scripts/aem.js';

export default async function decorate(block) {
  console.log(1111);
  const config = readBlockConfig(block);
  console.log(block, config);
}
