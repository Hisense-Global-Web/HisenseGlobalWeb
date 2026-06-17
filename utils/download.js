import { getGraphQLBaseUrl } from '../scripts/scripts.js';

const getFileInfo = (downloadlink) => {
  const isAssetsContent = downloadlink?.startsWith('/content');
  const noParamsUrl = downloadlink?.split('?')?.[0] ?? '';
  const replaceBtnLink = noParamsUrl.replace(`${window.location.origin}/`, '');
  const fileLink = !isAssetsContent ? noParamsUrl : getGraphQLBaseUrl() + replaceBtnLink;
  const fileName = noParamsUrl.substring(noParamsUrl.lastIndexOf('/') + 1);
  return { fileName, fileLink };
};

// eslint-disable-next-line import/prefer-default-export
export const handleCommonDownloadClick = (downloadlink) => {
  const { fileName, fileLink } = getFileInfo(downloadlink);
  const link = document.createElement('a');
  link.href = fileLink;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 以文件流的形式下载文件
export const handleDownloadFileByStream = async (downloadlink) => {
  const newLink = downloadlink?.includes('localhost:') ? downloadlink.replace(window.location.origin, '') : downloadlink;
  const { fileName, fileLink } = getFileInfo(newLink);
  try {
    // 1. 获取文件流
    const response = await fetch(fileLink);
    if (!response.ok) throw new Error('Network response was not ok');

    // 2. 转换为 Blob 对象
    const blob = await response.blob();

    // 3. 创建隐藏的下载链接
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = fileName; // 关键：指定下载文件名

    // 4. 触发点击并清理内存
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    a.remove();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Download failed:', error);
    // 降级处理：如果 Fetch 失败，尝试直接打开
    window.open(fileLink, '_blank');
  }
};
