/**
 * Command: Minify JSON (remove whitespace)
 */
export default function minify() {
  window.dispatchEvent(new CustomEvent("lavarrock:json-tool:minify"));
}
