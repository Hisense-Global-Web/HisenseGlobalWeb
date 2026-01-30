import { createElement, debounce } from '../../utils/dom-helper.js';
import { loadScrollTrigger } from '../../utils/animation-helper.js';
import { isUniversalEditorAsync } from '../../utils/ue-helper.js';

export default async function decorate(block) {
  // ========== CONSTRUCT DOM [START] ========== //
  const videoContent = block.querySelector('div:first-of-type');
  const animateContent = block.querySelector('div:nth-of-type(2)');

  let videoSrc = '';
  let videoPosterSrc = '';

  // Extract video source and poster from the first div
  [...videoContent.children].forEach((row) => {
    const link = row.querySelector('a');
    if (link) {
      videoSrc = link.href;
    }
    const img = row.querySelector('img');
    if (img) {
      videoPosterSrc = img.src;
    }
  });

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
  const coverImg = createElement('img');
  coverImg.src = videoPosterSrc;
  coverImg.classList.add('video-cover-image');

  const source = createElement('source');
  source.src = videoSrc;
  source.type = 'video/mp4';
  video.appendChild(source);
  block.appendChild(video);
  videoContent.remove();

  const playBtn = createElement('button', 'hero-presence-video-play-btn d-none');
  playBtn.textContent = 'Play';
  block.appendChild(playBtn);

  // Extract animated images from the second div
  const animatePicture = animateContent.querySelector('picture');
  if (!animatePicture) {
    return;
  }
  const animateImg = animatePicture.querySelector('img');
  animateImg.classList.add('animate-target');
  const animateContainer = createElement('div', 'hero-presence-animate h-grid-container');
  animateContainer.appendChild(animatePicture);
  block.appendChild(animateContainer);
  animateContent.remove();
  // ========== CONSTRUCT DOM [END] ========== //

  const isEditing = await isUniversalEditorAsync();
  if (isEditing) {
    return;
  }

  // ========== VIDEO [START] ========== //
  const playVideo = () => {
    video.play().catch(() => {
      // autoplay might be blocked
      playBtn.classList.remove('d-none');
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
  };

  const handleScroll = () => {
    const rect = video.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      video.pause();
    } else {
      playVideo();
    }
  };

  playVideo();
  setupVideoPlayPause();
  const debounceScroll = debounce(handleScroll, 150);
  window.addEventListener('scroll', debounceScroll);
  // ========== VIDEO [END] ========== //

  // ========== ANIMATION [START] ========== //
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
  gsap.set(block, { height: '100vh' });

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

  animateImg.addEventListener('load', animate, { once: true });

  const handleResize = debounce(() => {
    // animate();
    // Refresh ScrollTrigger after a brief delay to ensure DOM has updated
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }, 500);
  window.addEventListener('resize', handleResize);
  // ========== ANIMATION [END] ========== //
}
