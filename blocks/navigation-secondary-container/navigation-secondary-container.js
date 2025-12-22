/* eslint linebreak-style: "off" */

export default function decorate(block) {
  const isEditorMode = block.hasAttribute('data-aue-resource')
    || block.hasAttribute('data-aue-type')
    || block.closest('[data-aue-resource]')
    || block.closest('[data-aue-type]');
  if (!isEditorMode) {
    // logic
  }
}
