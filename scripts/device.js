export function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  // 检查用户代理
  if (/android|webos|iphone|ipad|ipod|Macintosh|blackberry|iemobile|opera mini|mobile/i.test(userAgent)) {
    return true;
  }
  return false;
}

// 设备检测函数
export function isMobileWindow() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 600;
}
