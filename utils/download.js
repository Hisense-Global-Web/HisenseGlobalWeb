import { getGraphQLBaseUrl } from '../scripts/scripts.js';

// eslint-disable-next-line import/prefer-default-export
export const handleCommonDownloadClick = (downloadlink) => {
  const isAssetsContent = downloadlink?.startsWith('/content');
  const link = document.createElement('a');
  let replaceBtnLink = downloadlink.replace(`${window.location.origin}/`, '');
  if (replaceBtnLink?.startsWith('/')) {
    replaceBtnLink = replaceBtnLink.slice(1);
  }
  link.href = !isAssetsContent ? downloadlink : getGraphQLBaseUrl() + replaceBtnLink;
  const noParamsUrl = downloadlink?.split('?')?.[0] ?? '';
  link.download = noParamsUrl.substring(downloadlink.lastIndexOf('/') + 1);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
