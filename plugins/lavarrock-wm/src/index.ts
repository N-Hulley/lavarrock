// ─── Re-export public API ─────────────────────────
// Other plugins should use the tiling context and types.
// The host app imports TilingShell for the content render slot.

// Components
export { TilingShell } from "./components/TilingShell";
export type { TilingShellProps } from "./components/TilingShell";
export { TilingProvider, useTiling } from "./components/TilingContext";
export type { TilingContextType } from "./components/TilingContext";
export { TilingNodeRenderer } from "./components/TilingNodeRenderer";
export { TileWindow } from "./components/TileWindow";
export { PaneLauncher } from "./components/PaneLauncher";
export { PanelWindow } from "./components/PanelWindow";

// Host bridge
export { WMHostBridgeProvider, useWMHost } from "./components/WMHostBridge";
export type {
  WMHostBridge,
  WMPlugin,
  PaneRendererProps,
} from "./components/WMHostBridge";

// Types & tree helpers
export type {
  TilingNode,
  TilingLeaf,
  TilingSplit,
  TilingLayoutState,
  SplitDirection,
} from "./lib/types";
export {
  createLeaf,
  splitNode,
  removeNode,
  findNode,
  findFirstLeaf,
  findLeaves,
  findParent,
  replaceNode,
  getAllLeafPluginIds,
  getNextLeaf,
  getPreviousLeaf,
  swapLeaves,
  generateNodeId,
} from "./lib/types";
