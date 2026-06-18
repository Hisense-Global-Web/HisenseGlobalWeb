import { getGraphQLBaseUrl } from '../scripts/scripts.js';

const getFileInfo = (downloadlink, fileName = null) => {
  let newFileName;
  const newLink = downloadlink?.includes('localhost:') ? downloadlink.replace(window.location.origin, '') : downloadlink;
  const isAssetsContent = newLink?.startsWith('/content');
  const noParamsUrl = newLink?.split('?')?.[0] ?? '';
  // 兼容可能存在的双斜杠问题
  const removeOrigin = noParamsUrl.startsWith(window.location.origin)
    ? noParamsUrl.slice(window.location.origin.length)
    : noParamsUrl;
  const replaceBtnLink = removeOrigin.startsWith('/') ? removeOrigin : `/${removeOrigin}`;
  let fileLink;
  if (!isAssetsContent) {
    fileLink = noParamsUrl;
  } else {
    // 避免出现双斜杠
    const baseUrl = getGraphQLBaseUrl().replace(/\/+$/, '');
    const path = replaceBtnLink.replace(/^\/+/, '/');
    fileLink = baseUrl + path;
  }

  if (fileName) {
    // 获取 downloadlink 原始文件名的后缀
    const originFileName = noParamsUrl.substring(noParamsUrl.lastIndexOf('/') + 1);
    const extIndex = originFileName.lastIndexOf('.');
    const ext = extIndex !== -1 ? originFileName.substring(extIndex) : '';
    newFileName = fileName + ext;
  } else {
    // 直接使用 downloadlink 里的文件名
    newFileName = noParamsUrl.substring(noParamsUrl.lastIndexOf('/') + 1);
  }
  return { fileName: newFileName, fileLink };
};

// eslint-disable-next-line import/prefer-default-export
export const handleCommonDownloadClick = async (downloadLink, downloadName = null) => {
  const { fileName, fileLink } = getFileInfo(downloadLink, downloadName);
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
