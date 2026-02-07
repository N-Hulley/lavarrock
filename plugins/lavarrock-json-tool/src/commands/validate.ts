/**
 * Command: Validate JSON (check syntax)
 */
export default function validate() {
  window.dispatchEvent(new CustomEvent("lavarrock:json-tool:validate"));
}
