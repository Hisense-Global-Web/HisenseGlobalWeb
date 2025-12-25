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
