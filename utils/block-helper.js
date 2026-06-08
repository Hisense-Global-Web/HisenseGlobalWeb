export function runBlockEnhancement(callback, options = {}) {
  if (typeof callback !== 'function') return () => {};

  const { timeout = 3000 } = options;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;

    Promise.resolve(callback()).catch((error) => {
      /* eslint-disable-next-line no-console */
      console.error('Block enhancement failed:', error);
    });
  };

  if (typeof globalThis.requestIdleCallback === 'function') {
    const idleId = globalThis.requestIdleCallback(run, { timeout });
    return () => {
      cancelled = true;
      if (typeof globalThis.cancelIdleCallback === 'function') {
        globalThis.cancelIdleCallback(idleId);
      }
    };
  }

  const timerId = setTimeout(run, 0);
  return () => {
    cancelled = true;
    clearTimeout(timerId);
  };
}
