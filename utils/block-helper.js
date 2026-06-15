function runBlockEnhancement(callback, options = {}) {
  if (typeof callback !== 'function') return () => {};

  const { timeout = 3000 } = options;
  let cancelled = false;
  const win = typeof window !== 'undefined' ? window : undefined;

  const run = () => {
    if (cancelled) return;

    Promise.resolve(callback()).catch((error) => {
      /* eslint-disable-next-line no-console */
      console.error('Block enhancement failed:', error);
    });
  };

  if (typeof win?.requestIdleCallback === 'function') {
    const idleId = win.requestIdleCallback(run, { timeout });
    return () => {
      cancelled = true;
      if (typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
    };
  }

  const timerId = setTimeout(run, 0);
  return () => {
    cancelled = true;
    clearTimeout(timerId);
  };
}

export { runBlockEnhancement };
export default runBlockEnhancement;
