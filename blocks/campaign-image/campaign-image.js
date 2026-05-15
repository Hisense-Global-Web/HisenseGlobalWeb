
export default function decorate(block) {
  const [pcImageEl, mobileImageEl] = [...block.children] ?? []
  if (pcImageEl) {
    pcImageEl.className = 'pc-image';
  }
  if (mobileImageEl) {
    mobileImageEl.className = 'mobile-image';
  }
}
