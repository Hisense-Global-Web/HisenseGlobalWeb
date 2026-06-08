const HLS_MIME_TYPE = 'application/vnd.apple.mpegurl';
const HLS_JS_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';

let hlsScriptPromise;

function getGlobalWindow() {
  return typeof window !== 'undefined' ? window : undefined;
}

function isHlsUrl(videoUrl = '') {
  return /\.m3u8(?:[?#]|$)/i.test(String(videoUrl).trim());
}

function removeVideoSources(video) {
  if (typeof video?.querySelectorAll === 'function') {
    video.querySelectorAll('source').forEach((source) => source.remove());
    return;
  }

  if (Array.isArray(video?.children)) {
    video.children = video.children.filter((child) => child.tagName !== 'SOURCE');
  }
}

function supportsNativeHls(video) {
  return Boolean(video?.canPlayType?.(HLS_MIME_TYPE));
}

async function loadHlsJs() {
  const win = getGlobalWindow();
  if (win?.Hls) return win.Hls;

  if (!hlsScriptPromise) {
    hlsScriptPromise = import('../scripts/aem.js')
      .then(({ loadScript }) => loadScript(HLS_JS_URL))
      .then(() => getGlobalWindow()?.Hls)
      .catch((error) => {
        hlsScriptPromise = null;
        throw error;
      });
  }

  return hlsScriptPromise;
}

function setNativeVideoSource(video, videoUrl) {
  removeVideoSources(video);
  video.src = videoUrl;
  video.load?.();
}

function setMp4VideoSource(video, videoUrl) {
  removeVideoSources(video);
  video.removeAttribute?.('src');

  const source = document.createElement('source');
  source.src = videoUrl;
  source.type = 'video/mp4';
  video.appendChild(source);
  video.load?.();
}

async function setVideoSource(video, videoUrl = '') {
  if (!video || !videoUrl) return false;

  const src = String(videoUrl).trim();
  if (!isHlsUrl(src)) {
    setMp4VideoSource(video, src);
    return true;
  }

  if (supportsNativeHls(video)) {
    setNativeVideoSource(video, src);
    return true;
  }

  try {
    const Hls = await loadHlsJs();
    if (Hls?.isSupported?.()) {
      video.hls?.destroy?.();
      video.hls = new Hls();
      video.hls.loadSource(src);
      video.hls.attachMedia(video);
      return true;
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Failed to load hls.js:', error);
  }

  setNativeVideoSource(video, src);
  return false;
}

export { setVideoSource };
export default setVideoSource;
