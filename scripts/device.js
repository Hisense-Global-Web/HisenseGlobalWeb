export function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  // 检查用户代理
  // if (/android|webos|iphone|ipad|ipod|Macintosh|blackberry|iemobile|opera mini|mobile/i.test(userAgent)) {
  //   return true;
  // }

  // 1. 基础正则检测（不含 Macintosh）
  const isMobileTest = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
  // 2. 针对 iPad Pro/新款 iPad 的特殊检测
  // 这些设备 UA 包含 Macintosh，但支持触控点
  if (!isMobileTest && /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1) {
    return true;
  }
  return false;
}

// 设备检测函数
export function isMobileWindow() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 860;
}
