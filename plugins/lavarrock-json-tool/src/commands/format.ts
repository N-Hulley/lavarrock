/**
 * Command: Format (pretty-print) JSON
 *
 * This is a declarative command registration.
 * The actual logic lives in the JsonToolPane component state.
 * Commands can also be invoked programmatically via
 * ctx.executeCommand("lavarrock.json-tool://command/format").
 */
export default function format() {
  window.dispatchEvent(new CustomEvent("lavarrock:json-tool:format"));
}
