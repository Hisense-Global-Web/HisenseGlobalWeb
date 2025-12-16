export default function decorate(block) {
  /* change to ul, li */
  const newDiv = document.createElement('div');

  const video = document.createElement('video');
  video.id = 'myVideo';
  video.controls = true;
  video.width = 640;
  video.height = 360;
  video.preload = 'auto';
  video.autoplay = true;
  video.style.border = '1px solid #ccc';
  video.poster = '';
  const source = document.createElement('source');
  source.src = 'https://author-p174152-e1855821.adobeaemcloud.com/ui#/aem/assetdetails.html/content/dam/hisense/us/collection-cards/2025UXfinal_30S_1013.mp4'; // 替换为你的视频路径
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  // 将source添加到video中
  video.appendChild(source);
  newDiv.appendChild(video);
  console.log('...block.children');
  console.log(...block.children);
  video.addEventListener('loadeddata', () => {
    console.log('视频已加载');
  });

  video.addEventListener('play', () => {
    console.log('视频开始播放');
  });
  block.replaceChildren(newDiv);
}
