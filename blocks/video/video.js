export default function decorate(block) {
  /* change to ul, li */

  let videourl;
  let imgUrl;
  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (link) {
      videourl = link.href;
    }
    const img = row.querySelector('img');
    if (img) {
      imgUrl = img.src;
    }
  });
  const newDiv = document.createElement('div');
  newDiv.classList.add('video-content');
  const video = document.createElement('video');
  const coverImg = document.createElement('img');
  coverImg.src = imgUrl;
  coverImg.classList.add('video-cover-image');
  video.id = 'myVideo';
  video.controls = true;
  video.preload = 'auto';
  const source = document.createElement('source');
  source.src = videourl;
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  // 将source添加到video中
  video.appendChild(source);
  newDiv.appendChild(video);
  newDiv.appendChild(coverImg);
  coverImg.addEventListener('click', () => {
    video.muted = true;
    video.play();
    coverImg.style.display = 'none';
  });

  // video.addEventListener('play', () => {
  //   console.log('视频开始播放');
  // });
  block.replaceChildren(newDiv);
}
