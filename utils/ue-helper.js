/**
 * @file ue-helper.js
 * @description Utility functions for Adobe Universal Editor (UE) integration.
 */

/**
 * Checks if the application is running inside the Adobe Universal Editor.
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export const isUniversalEditor = () => window.UniversalEditorEmbedded !== undefined;

export async function isUniversalEditorAsync() {
  if (window.UniversalEditorEmbedded) return true;

  return new Promise((resolve) => {
    window.addEventListener('aue:ui-ready', () => resolve(true), { once: true });
    setTimeout(() => resolve(!!window.UniversalEditorEmbedded), 2000);
  });
}

// 判断是不是Switch开关
export const checkSwitch = (switchEl) => {
  if (switchEl?.children[0]?.textContent === 'true' || switchEl?.children[0]?.textContent === 'false') {
    return true;
  }
  return false;
};

export const getSwitchValue = (switchEl) => switchEl?.children?.[0]?.textContent?.trim() === 'true';
