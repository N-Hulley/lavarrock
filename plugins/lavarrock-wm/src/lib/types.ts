/**
 * Hyprland-style binary-tree tiling layout types.
 *
 * The layout is represented as a binary tree where each node is either:
 * - A **leaf** containing a single plugin pane, or
 * - A **split** that divides space between two children (horizontal or vertical).
 *
 * This is the same model used by Hyprland, i3, bspwm, etc.
 */

export type SplitDirection = "horizontal" | "vertical";

/** A leaf node renders a single plugin pane */
export interface TilingLeaf {
  type: "leaf";
  id: string; // unique node id
  pluginId: string; // which plugin occupies this leaf
}

/** A split node divides space between two children */
export interface TilingSplit {
  type: "split";
  id: string; // unique node id
  direction: SplitDirection;
  /** Percentage of space given to the first child (0-100) */
  ratio: number;
  children: [TilingNode, TilingNode];
}

export type TilingNode = TilingLeaf | TilingSplit;

/** Serialisable layout state stored in localStorage */
export interface TilingLayoutState {
  root: TilingNode | null;
  /** The node id that currently has focus (highlighted border) */
  focusedNodeId: string | null;
}

// ─── Tree helpers ────────────────────────────────────────────

let _nextId = 1;
export function generateNodeId(): string {
  return `node-${_nextId++}-${Date.now().toString(36)}`;
}

/** Create a new leaf */
export function createLeaf(pluginId: string): TilingLeaf {
  return { type: "leaf", id: generateNodeId(), pluginId };
}

/** Wrap an existing node by splitting it with a new leaf */
export function splitNode(
  existing: TilingNode,
  newPluginId: string,
  direction: SplitDirection,
  insertAfter = true,
): TilingSplit {
  const newLeaf = createLeaf(newPluginId);
  return {
    type: "split",
    id: generateNodeId(),
    direction,
    ratio: 50,
    children: insertAfter ? [existing, newLeaf] : [newLeaf, existing],
  };
}

/** Find a node by id (DFS) */
export function findNode(
  root: TilingNode | null,
  nodeId: string,
): TilingNode | null {
  if (!root) return null;
  if (root.id === nodeId) return root;
  if (root.type === "split") {
    return (
      findNode(root.children[0], nodeId) ?? findNode(root.children[1], nodeId)
    );
  }
  return null;
}

/** Find the parent split of a node */
export function findParent(
  root: TilingNode | null,
  nodeId: string,
): TilingSplit | null {
  if (!root || root.type === "leaf") return null;
  if (root.children[0].id === nodeId || root.children[1].id === nodeId) {
    return root;
  }
  return (
    findParent(root.children[0], nodeId) ?? findParent(root.children[1], nodeId)
  );
}

/** Remove a node and promote its sibling */
export function removeNode(
  root: TilingNode | null,
  nodeId: string,
): TilingNode | null {
  if (!root) return null;
  if (root.id === nodeId) return null;
  if (root.type === "leaf") return root;

  if (root.children[0].id === nodeId) return root.children[1];
  if (root.children[1].id === nodeId) return root.children[0];

  const newLeft = removeNode(root.children[0], nodeId);
  const newRight = removeNode(root.children[1], nodeId);

  if (!newLeft && !newRight) return null;
  if (!newLeft) return newRight;
  if (!newRight) return newLeft;

  return {
    ...root,
    children: [newLeft, newRight],
  };
}

/** Replace a node in the tree by id */
export function replaceNode(
  root: TilingNode,
  nodeId: string,
  replacement: TilingNode,
): TilingNode {
  if (root.id === nodeId) return replacement;
  if (root.type === "leaf") return root;

  return {
    ...root,
    children: [
      replaceNode(root.children[0], nodeId, replacement),
      replaceNode(root.children[1], nodeId, replacement),
    ],
  };
}

/** Collect all leaf plugin IDs */
export function getAllLeafPluginIds(root: TilingNode | null): string[] {
  if (!root) return [];
  if (root.type === "leaf") return [root.pluginId];
  return [
    ...getAllLeafPluginIds(root.children[0]),
    ...getAllLeafPluginIds(root.children[1]),
  ];
}

/** Find the first leaf (for focusing after removal) */
export function findFirstLeaf(root: TilingNode | null): TilingLeaf | null {
  if (!root) return null;
  if (root.type === "leaf") return root;
  return findFirstLeaf(root.children[0]);
}

/** Collect all leaves in order */
export function findLeaves(root: TilingNode | null): TilingLeaf[] {
  if (!root) return [];
  if (root.type === "leaf") return [root];
  return [...findLeaves(root.children[0]), ...findLeaves(root.children[1])];
}

/** Get the next leaf after the given node id */
export function getNextLeaf(
  root: TilingNode | null,
  currentId: string,
): TilingLeaf | null {
  const leaves = findLeaves(root);
  const idx = leaves.findIndex((l) => l.id === currentId);
  if (idx === -1 || leaves.length === 0) return null;
  return leaves[(idx + 1) % leaves.length];
}

/** Get the previous leaf before the given node id */
export function getPreviousLeaf(
  root: TilingNode | null,
  currentId: string,
): TilingLeaf | null {
  const leaves = findLeaves(root);
  const idx = leaves.findIndex((l) => l.id === currentId);
  if (idx === -1 || leaves.length === 0) return null;
  return leaves[(idx - 1 + leaves.length) % leaves.length];
}

/** Swap two leaf nodes by their ids */
export function swapLeaves(
  root: TilingNode,
  idA: string,
  idB: string,
): TilingNode {
  const nodeA = findNode(root, idA) as TilingLeaf | null;
  const nodeB = findNode(root, idB) as TilingLeaf | null;
  if (!nodeA || !nodeB || nodeA.type !== "leaf" || nodeB.type !== "leaf") {
    return root;
  }

  // Swap plugin IDs
  const pluginA = nodeA.pluginId;
  const pluginB = nodeB.pluginId;

  const withFirst = replaceNode(root, idA, { ...nodeA, pluginId: pluginB });
  return replaceNode(withFirst, idB, { ...nodeB, pluginId: pluginA });
}
