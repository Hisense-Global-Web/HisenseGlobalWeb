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
export const createElement = (tag = 'div', classNames = '') => {
  const element = document.createElement(tag);
  if (classNames) {
    element.className = classNames.trim();
  }
  return element;
};

/**
 * Debounce a function to limit how often it can be called.
 * @param func
 * @param wait
 * @returns {(function(...[*]): void)|*}
 */
export const debounce = (func, wait) => {
  let timeoutId;

  return (...args) => {
    // Clear the previous timer if the function is called again
    clearTimeout(timeoutId);

    // Set a new timer
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
};
