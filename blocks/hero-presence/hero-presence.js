import { createElement, debounce } from '../../utils/dom-helper.js';
import { loadScrollTrigger } from '../../utils/animation-helper.js';
import { checkSwitch, isUniversalEditor } from '../../utils/ue-helper.js';
import { whenElementReady } from '../../utils/carousel-common.js';
import { isDeliveryDynamicMediaUrl, toDynamicMediaVideoUrl } from '../../utils/dynamic-media.js';
import { runBlockEnhancement } from '../../utils/block-helper.js';
import { setVideoSource } from '../../utils/hls-video.js';
import {
  checkDyanmicMediaImage,
  getHeroBannerSmartCropUrl,
} from '../hero-banner/media-reference.js';

const segments = window.location.pathname.split('/').filter(Boolean);
const country = segments[segments[0] === 'content' ? 2 : 0] || 'cn';

async function initScrollAnimation(block) {
  const scrollTriggerLoaded = await loadScrollTrigger();
  if (!scrollTriggerLoaded) {
    return;
  }

  const {
    gsap,
    ScrollTrigger,
  } = window;

  ScrollTrigger.config({ autoRefreshEvents: 'DOMContentLoaded,load' });

  gsap.registerPlugin(ScrollTrigger);

  let scrollTriggerInstance = null;

  const cleanup = () => {
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }
  };

  const animate = () => {
    cleanup();

    gsap.timeline({
      scrollTrigger: {
        trigger: block,
        start: 'top top',
        end: '+=50%',
        scrub: 0.1,
        pin: true,
        // markers: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    ScrollTrigger.observe({
      target: block,
      type: 'wheel,touch',
      onUp: () => {
        cleanup();
      },
      onDown: () => {
        block.classList.add('animated');
      },
    });
  };

  animate();

  const handleResize = debounce(() => {
    // Refresh ScrollTrigger after a brief delay to ensure DOM has updated
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, 500);
  window.addEventListener('resize', handleResize);
}

export default function decorate(block) {
  const hasDynamicMedia = checkSwitch(block.children[0]);
  if (hasDynamicMedia) {
    block.children[0]?.remove();
  }
  // ========== CONSTRUCT DOM [START] ========== //
  const videoContent = block.querySelector('div:first-of-type');

  let videoSrc = '';
  let videoPosterSrc = '';
  let dynamicMediaPosterBaseSrc = '';

  const [videoAllEl, overlayEl] = [...block.children];

  const [videoEl, posterEl] = [...videoAllEl?.children[0]?.children ?? []];

  if (videoEl) {
    videoSrc = toDynamicMediaVideoUrl(videoEl.querySelector('a')?.href);
  }

  if (posterEl) {
    videoPosterSrc = posterEl?.querySelector('img')?.src;
    if (!videoPosterSrc) {
      videoPosterSrc = posterEl?.querySelector('a')?.href;
    }

    if (videoPosterSrc && isDeliveryDynamicMediaUrl(videoPosterSrc)) {
      dynamicMediaPosterBaseSrc = videoPosterSrc;
      videoPosterSrc = getHeroBannerSmartCropUrl(dynamicMediaPosterBaseSrc);
    }
  }

  if (!videoSrc) {
    return;
  }

  // Create the video element
  const video = createElement('video', 'hero-presence-video');
  const videoAttr = {
    loop: 'true',
    preload: 'auto',
    poster: videoPosterSrc,
    autoplay: 'true',
    muted: 'true',
    playsinline: 'true',
    'webkit-playsinline': 'true',
  };
  Object.entries(videoAttr).forEach(([key, value]) => {
    video.setAttribute(key, value);
  });

  video.classList.add('autoplay-video');
  video.setAttribute('data-video-autoplay', 'true');
  const coverImg = checkDyanmicMediaImage(posterEl, 'poster');
  coverImg.classList.add('video-cover-image');

  const videoReady = setVideoSource(video, videoSrc);
  block.appendChild(video);
  videoContent.remove();

  if (dynamicMediaPosterBaseSrc) {
    const updatePoster = debounce(() => {
      const nextPoster = getHeroBannerSmartCropUrl(dynamicMediaPosterBaseSrc);
      if (video.getAttribute('poster') !== nextPoster) {
        video.setAttribute('poster', nextPoster);
      }
    }, 150);
    window.addEventListener('resize', updatePoster);
  }

  const playBtn = createElement('button', 'hero-presence-video-play-btn');
  const playIcon = createElement('img', 'hero-presence-video-play-icon');
  playIcon.src = `/content/dam/hisense/${country}/common-icons/play-dark-mode.svg`;
  playBtn.appendChild(playIcon);
  const pauseIcon = createElement('img', 'hero-presence-video-pause-icon');
  pauseIcon.src = `/content/dam/hisense/${country}/common-icons/pause-dark-mode.svg`;
  playBtn.appendChild(pauseIcon);
  block.appendChild(playBtn);

  // Extract animated images from the second div
  const animatePicture = overlayEl?.querySelector('picture') || overlayEl?.querySelector('a');
  if (!animatePicture) {
    return;
  }
  const animateImg = checkDyanmicMediaImage(overlayEl, 'overlay');
  animateImg.classList.add('animate-target');
  const animateContainer = createElement('div', 'hero-presence-animate h-grid-container');
  animateContainer.appendChild(animateImg);
  block.appendChild(animateContainer);
  // overlayEl.remove();
  // ========== CONSTRUCT DOM [END] ========== //

  // ========== VIDEO [START] ========== //
  const playVideo = () => {
    playBtn.classList.toggle('playing', true);
    video.muted = true;
    video.play()
      .catch((error) => {
        /* eslint-disable-next-line no-console */
        console.error('Video play failed:', error);
        // autoplay might be blocked
        playBtn.classList.toggle('playing', false);
      });
  };

  const setupVideoPlayPause = () => {
    playBtn.addEventListener('click', () => {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', () => {
      playBtn.classList.toggle('playing', true);
    });
    video.addEventListener('pause', () => {
      playBtn.classList.toggle('playing', false);
    });
  };

  const handleScroll = () => {
    const rect = video.getBoundingClientRect();
    if (!video.paused && (rect.bottom < 0 || rect.top > window.innerHeight)) {
      video.pause();
      playBtn.classList.toggle('pause-on-scroll', true);
    } else if (rect.bottom >= 0 && rect.top <= window.innerHeight && playBtn.classList.contains('pause-on-scroll')) {
      playVideo();
      playBtn.classList.toggle('pause-on-scroll', false);
    }
  };

  videoReady.then(() => {
    playVideo();
  }).catch(() => {
    playVideo();
  });
  setupVideoPlayPause();
  const debounceScroll = debounce(handleScroll, 150);
  window.addEventListener('scroll', debounceScroll);
  // ========== VIDEO [END] ========== //

  if (!isUniversalEditor()) {
    runBlockEnhancement(() => initScrollAnimation(block));
  }

  whenElementReady('#navigation', () => {
    const header = document.querySelector('#navigation');
    if (!header) return;

    header.style.backgroundColor = 'white';
  });
}
