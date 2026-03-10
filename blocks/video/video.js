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
  video.setAttribute('data-video-autoplay', 'true');
  const coverImg = document.createElement('img');
  coverImg.src = imgUrl;
  coverImg.classList.add('video-cover-image');
  video.id = 'myVideo';
  video.controls = true;
  video.width = 1120;
  video.preload = 'auto';
  // 关键修改：添加 playsinline 和 muted 属性
  video.playsInline = true;
  video.muted = true; // iPhone 要求静音才能自动播放

  const source = document.createElement('source');
  source.src = videourl;
  source.type = 'video/mp4';
  video.innerHTML = '';
  video.appendChild(source);
  newDiv.appendChild(video);

  newDiv.appendChild(coverImg);

  // 修改1：简化封面点击事件 - 保持静音状态不变
  coverImg.addEventListener('click', () => {
  // 关键修改：不改变静音状态，直接播放
    video.play();
    video.muted = false;
    coverImg.style.display = 'none';
  });

  video.addEventListener('play', () => {
    coverImg.style.display = 'none';
  });

  block.replaceChildren(newDiv);

  const videoAutoplay = {
    init() {
      this.videos = document.querySelectorAll('[data-video-autoplay]');
      this.setupVideos();
      this.setupObserver();
    // 移除 addVolumeControls 调用，使用原生控制栏
    },

    setupVideos() {
      this.videos.forEach((v) => {
      // 确保所有视频都是静音和可内联播放的
        v.muted = true; // 默认静音
        v.playsInline = true;
        v.preload = 'metadata';
        v.setAttribute('data-was-playing', 'false');
        v.setAttribute('playsinline', 'true');
        v.setAttribute('muted', 'true');
        v.setAttribute('autoplay', 'true');
      });
    },

    setupObserver() {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting) {
            this.playVideo(v);
          } else {
            this.pauseVideo(v);
          }
        });
      }, { threshold: 0.3 });

      this.videos.forEach((v) => this.observer.observe(v));
    },

    async playVideo(v) {
      if (!v.paused) return;
      try {
      // 关键修改：保持静音状态不变
      // 不在这里修改 v.muted，让用户通过原生控制栏控制
        await v.play();
        // 查找对应的封面图
        const parent = v.parentElement;
        const cover = parent.querySelector('.video-cover-image');
        if (cover) cover.style.display = 'none';
        v.setAttribute('data-was-playing', 'true');
      } catch (error) { /* empty */ }
    },

    pauseVideo(v) {
      if (!v.paused) {
        v.setAttribute('data-was-playing', 'true');
        v.pause();
      } else {
        v.setAttribute('data-was-playing', 'false');
      }
    },
  };

  // 修改初始化方式
  setTimeout(() => {
    videoAutoplay.init();
  }, 100);

  video.addEventListener('ended', () => {
    video.currentTime = 0;
    // 保持静音状态不变
    video.play();
  });
}
