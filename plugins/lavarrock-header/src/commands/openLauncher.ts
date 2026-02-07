/**
 * Command: Open the pane launcher (⌘P)
 */
export default function openLauncher() {
  window.dispatchEvent(
    new CustomEvent("lavarrock:open-launcher", { detail: true }),
  );
}
