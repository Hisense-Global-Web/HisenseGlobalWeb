/**
 * Checks if the application is running inside the Adobe Universal Editor.
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export function isUniversalEditor() {
  return typeof window.adobeUniversalEditor !== 'undefined' && window.adobeUniversalEditor !== null;
}
