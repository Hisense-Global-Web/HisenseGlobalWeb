/**
 * @file dom-helper.js
 * @description Utility functions for DOM manipulation.
 */

/**
 * Creates an HTML element with optional class names.
 * @param tag
 * @param classNames
 * @returns {HTMLDivElement}
 */
// eslint-disable-next-line import/prefer-default-export
export const createElement = (tag = 'div', classNames = '') => {
  const element = document.createElement(tag);
  if (classNames) {
    element.className = classNames.trim();
  }
  return element;
};
