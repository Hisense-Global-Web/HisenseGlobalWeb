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
  // 添加备用文本
  video.innerHTML = '';
  // 将source添加到video
  video.appendChild(source);
  newDiv.appendChild(video);

  newDiv.appendChild(coverImg);
  // 修改点击事件处理
  coverImg.addEventListener('click', () => {
  // 移除静音以允许用户听到声音
    video.play();
    video.muted = false;
    coverImg.style.display = 'none';
  });

  video.addEventListener('play', () => {
  // console.log('视频开始播放');
    coverImg.style.display = 'none';
  });

  block.replaceChildren(newDiv);

  const videoAutoplay = {
    init() {
      this.videos = document.querySelectorAll('[data-video-autoplay]');
      this.setupVideos();
      this.setupObserver();
      this.addVolumeControls();
    },

    setupVideos() {
      this.videos.forEach((v) => {
      // 确保所有视频都是静音和可内联播放的
        v.muted = true;
        v.playsInline = true;
        v.preload = 'metadata';
        v.setAttribute('data-was-playing', 'false');
        v.setAttribute('playsinline', 'true'); // 添加属性
        v.setAttribute('muted', 'true'); // 添加属性
        v.setAttribute('autoplay', 'true'); // 添加 autoplay 属性
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
      // 确保视频是静音状态（iPhone 要求）
        v.muted = true;
        await v.play();
        coverImg.style.display = 'none';
        v.setAttribute('data-was-playing', 'true');
      } catch (error) {
        // 如果自动播放失败，显示封面图
        coverImg.style.display = 'block';
      }
    },

    pauseVideo(v) {
      if (!v.paused) {
        v.setAttribute('data-was-playing', 'true');
        v.pause();
      } else {
        v.setAttribute('data-was-playing', 'false');
      }
    },

    addVolumeControls() {
    // 添加音量控制按钮
    },
  };

  // 修改初始化方式
  // 使用 setTimeout 确保 DOM 完全加载
  setTimeout(() => {
    videoAutoplay.init();
  }, 100);

  // 添加点击事件到整个 video 区域，允许用户解除静音
  video.addEventListener('click', () => {
    if (video.muted) {
      video.muted = false;
    }
  });

  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.muted = true; // 重置为静音以便再次自动播放
    video.play();
  });
}
