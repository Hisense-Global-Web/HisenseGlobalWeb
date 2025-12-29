function autoPlay() {
  document.addEventListener('DOMContentLoaded', () => {
    // 获取所有需要自动播放的视频
    const videos = document.querySelectorAll('.autoplay-video');

    // 设置视频为静音（大多数浏览器要求静音才能自动播放）
    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true; // 移动端防止全屏播放
    });
    // 创建 Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting) {
          // 视频进入视口，尝试播放
          video.play().catch((e) => {
            console.log('视频自动播放失败:', e);
          });
        } else {
          // 视频离开视口，暂停
          video.pause();
        }
      });
    }, {
      threshold: 0.5, // 当视频50%可见时触发
      rootMargin: '0px 0px -10% 0px', // 可以调整触发区域
    });

    // 观察所有视频
    videos.forEach((video) => observer.observe(video));
  });
}
export default async function decorate() {
  autoPlay();
}
