import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import type {
  TilingNode,
  TilingLayoutState,
  SplitDirection,
} from "../lib/types";
import {
  createLeaf,
  splitNode,
  removeNode,
  findNode,
  findFirstLeaf,
  replaceNode,
  getAllLeafPluginIds,
  swapLeaves,
  getNextLeaf,
  getPreviousLeaf,
} from "../lib/types";

const STORAGE_KEY = "lavarrock_tiling_layout";

export interface TilingContextType {
  /** The root of the layout tree */
  root: TilingNode | null;
  /** The focused node id */
  focusedNodeId: string | null;

  /** Open a plugin. If no root, creates it as the only pane.
   *  Otherwise splits the focused pane (or first leaf). */
  openPlugin: (pluginId: string, direction?: SplitDirection) => void;

  /** Split a specific node with a new plugin */
  splitPane: (
    nodeId: string,
    pluginId: string,
    direction: SplitDirection,
    insertAfter?: boolean,
  ) => void;

  /** Close / remove a pane by its node id */
  closePane: (nodeId: string) => void;

  /** Set focus to a node */
  focusNode: (nodeId: string) => void;

  /** Focus the next leaf pane */
  focusNext: () => void;

  /** Focus the previous leaf pane */
  focusPrevious: () => void;

  /** Swap two leaf panes */
  swapPanes: (nodeIdA: string, nodeIdB: string) => void;

  /** Replace the entire tree (e.g. to restore a preset layout) */
  setRoot: (root: TilingNode | null) => void;

  /** Update the split ratio on a split node */
  updateRatio: (nodeId: string, ratio: number) => void;

  /** Check if a plugin is already open in the tree */
  isPluginOpen: (pluginId: string) => boolean;

  /** Get all open plugin IDs */
  openPluginIds: string[];
}

const TilingContext = createContext<TilingContextType | undefined>(undefined);

export const TilingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [root, setRootState] = useState<TilingNode | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Persist layout to localStorage
  useEffect(() => {
    if (root) {
      const state: TilingLayoutState = { root, focusedNodeId };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore
      }
    }
  }, [root, focusedNodeId]);

  // Restore layout from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: TilingLayoutState = JSON.parse(stored);
        if (state.root) {
          setRootState(state.root);
          setFocusedNodeId(state.focusedNodeId);
          return;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setRoot = useCallback((newRoot: TilingNode | null) => {
    setRootState(newRoot);
    if (!newRoot) {
      setFocusedNodeId(null);
    } else {
      const first = findFirstLeaf(newRoot);
      if (first) setFocusedNodeId(first.id);
    }
  }, []);

  const openPluginIds = getAllLeafPluginIds(root);

  const isPluginOpen = useCallback(
    (pluginId: string) => openPluginIds.includes(pluginId),
    [openPluginIds],
  );

  const focusNode = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
  }, []);

  const focusNext = useCallback(() => {
    if (!root || !focusedNodeId) return;
    const next = getNextLeaf(root, focusedNodeId);
    if (next) setFocusedNodeId(next.id);
  }, [root, focusedNodeId]);

  const focusPrevious = useCallback(() => {
    if (!root || !focusedNodeId) return;
    const prev = getPreviousLeaf(root, focusedNodeId);
    if (prev) setFocusedNodeId(prev.id);
  }, [root, focusedNodeId]);

  const openPlugin = useCallback(
    (pluginId: string, direction: SplitDirection = "horizontal") => {
      if (!root) {
        // First pane
        const leaf = createLeaf(pluginId);
        setRootState(leaf);
        setFocusedNodeId(leaf.id);
        return;
      }

      // Find the focused node, or fall back to first leaf
      const targetId = focusedNodeId ?? findFirstLeaf(root)?.id;
      if (!targetId) return;

      const target = findNode(root, targetId);
      if (!target) return;

      const newSplit = splitNode(target, pluginId, direction);
      const newRoot = replaceNode(root, targetId, newSplit);
      setRootState(newRoot);
      // Focus the newly created leaf (second child when insertAfter=true)
      const newLeaf = newSplit.children[1];
      setFocusedNodeId(newLeaf.id);
    },
    [root, focusedNodeId],
  );

  const splitPane = useCallback(
    (
      nodeId: string,
      pluginId: string,
      direction: SplitDirection,
      insertAfter = true,
    ) => {
      if (!root) return;
      const target = findNode(root, nodeId);
      if (!target) return;

      const newSplit = splitNode(target, pluginId, direction, insertAfter);
      const newRoot = replaceNode(root, nodeId, newSplit);
      setRootState(newRoot);

      const newLeaf = insertAfter ? newSplit.children[1] : newSplit.children[0];
      setFocusedNodeId(newLeaf.id);
    },
    [root],
  );

  const closePane = useCallback(
    (nodeId: string) => {
      if (!root) return;

      const newRoot = removeNode(root, nodeId);
      setRootState(newRoot);

      if (!newRoot) {
        setFocusedNodeId(null);
      } else if (focusedNodeId === nodeId) {
        const first = findFirstLeaf(newRoot);
        setFocusedNodeId(first?.id ?? null);
      }
    },
    [root, focusedNodeId],
  );

  const swapPanes = useCallback(
    (nodeIdA: string, nodeIdB: string) => {
      if (!root) return;
      setRootState(swapLeaves(root, nodeIdA, nodeIdB));
    },
    [root],
  );

  const updateRatio = useCallback(
    (nodeId: string, ratio: number) => {
      if (!root) return;
      const node = findNode(root, nodeId);
      if (!node || node.type !== "split") return;

      const updated: TilingNode = { ...node, ratio };
      setRootState(replaceNode(root, nodeId, updated));
    },
    [root],
  );

  const value: TilingContextType = {
    root,
    focusedNodeId,
    openPlugin,
    splitPane,
    closePane,
    focusNode,
    focusNext,
    focusPrevious,
    swapPanes,
    setRoot,
    updateRatio,
    isPluginOpen,
    openPluginIds,
  };

  return (
    <TilingContext.Provider value={value}>{children}</TilingContext.Provider>
  );
};

export const useTiling = () => {
  const ctx = useContext(TilingContext);
  if (!ctx) throw new Error("useTiling must be used within TilingProvider");
  return ctx;
};
