/**
 * PaneRenderer — the renderer for the `pane` resource type.
 *
 * In the spec, `resourceTypes.pane.renderer` points here.
 * This component receives a registered pane resource and renders
 * it inside the tiling grid. The actual component rendering is
 * delegated to the host bridge's PaneRenderer to keep the WM
 * decoupled from host-app internals.
 */
export { TileWindow as default } from "../components/TileWindow";
