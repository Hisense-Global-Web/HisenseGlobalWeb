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
  video.classList.add('autoplay-video');
  // const coverImg = document.createElement('img');
  // coverImg.src = imgUrl;
  // coverImg.classList.add('video-cover-image');
  video.id = 'myVideo';
  video.controls = true;
  video.width = 1120;
  video.preload = 'auto';
  const source = document.createElement('source');
  source.src = videourl;
  source.type = 'video/mp4';
  // 添加备用文本
  video.innerHTML = '';
  // 将source添加到video中
  video.appendChild(source);
  newDiv.appendChild(video);

  // newDiv.appendChild(coverImg);
  // coverImg.addEventListener('click', () => {
  //   video.play();
  //   coverImg.style.display = 'none';
  // });

  // video.addEventListener('play', () => {
  //   console.log('视频开始播放');
  // });
  block.replaceChildren(newDiv);
  document.addEventListener('DOMContentLoaded', () => {
    // 获取所有需要自动播放的视频
    const videos = document.querySelectorAll('.autoplay-video');

    // 设置视频为静音（大多数浏览器要求静音才能自动播放）
    videos.forEach((videoItem) => {
      videoItem.muted = true;
      videoItem.playsInline = true; // 移动端防止全屏播放
    });
    // 创建 Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoItem = entry.target;

        if (entry.isIntersecting) {
          // 视频进入视口，尝试播放
          videoItem.play().catch((e) => {
            console.log('视频自动播放失败:', e);
          });
        } else {
          // 视频离开视口，暂停
          videoItem.pause();
        }
      });
    }, {
      threshold: 0.5, // 当视频50%可见时触发
      rootMargin: '0px 0px -10% 0px', // 可以调整触发区域
    });

    // 观察所有视频
    videos.forEach((item) => observer.observe(item));
  })
}
