// 重置外部链接函数
export function resetExternalUrl(url) {
  let tempUrl = null;
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    // 如果链接已经是完整的 URL，直接使用
    tempUrl = url;
  }
  if (url && url.includes('iframe')) {
    // 如果链接包含 iframe 标签，尝试解析出 src 属性
    const parser = new DOMParser();
    const doc = parser.parseFromString(url, 'text/html');
    const iframe = doc.querySelector('iframe');
    tempUrl = iframe ? iframe.getAttribute('src') : null;
  }
  return tempUrl;
}

/**
 * 处理外部视频链接，生成 iframe 元素
 * @param {*} externalVideoUrl 外部视频链接
 * @returns 处理后的 iframe 元素
 */
export function iframeVideoHandler(externalVideoUrl) {
  const externalVideoBox = document.createElement('div');
  externalVideoBox.className = 'external-video-box';
  // const originalIframe = document.getElementById('external-video-iframe');
  // if (originalIframe) {
  //   // 如果已经存在 iframe，先移除旧的 iframe，避免重复添加, 然后再创建新的 iframe,以确保视频能够从头开始播放
  //   originalIframe.remove();
  // }
  const iframe = document.createElement('iframe');
  iframe.id = 'external-video-iframe';
  iframe.src = externalVideoUrl; // 关键修改：自动播放并静音
  // 允许自动播放和加密媒体
  iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
  iframe.width = '100%';
  iframe.style.border = '0';
  externalVideoBox.appendChild(iframe);
  return externalVideoBox;
}
