/**
 * Command: Reset the tiling layout to defaults
 *
 * Dispatches a custom event that the host app / WM plugin
 * listens for to rebuild the default layout tree.
 */
export default function resetLayout() {
  window.dispatchEvent(new CustomEvent("lavarrock:reset-layout"));
}
