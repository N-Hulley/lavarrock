/**
 * Theme utilities — backward-compatible API layer.
 *
 * All heavy lifting now lives in theme-engine.ts.
 * This module re-exports everything the rest of the plugin needs
 * and provides legacy-shaped helpers that delegate to the engine.
 */

// Re-export everything from the engine
export {
  // colour helpers
  hexToHSL,
  hslToHex,
  toHSLString,
  parseHSLString,
  hslStringToHex,
  hexToHSLString,
  // engine types
  type ThemeInputs,
  type GradientConfig,
  type TextureConfig,
  type GlassConfig,
  type HarmonyMode,
  HARMONY_MODES,
  computeHarmonyHues,
  type ThemeAttribute,
  type HexAttribute,
  type CssAttribute,
  type DynamicHexAttribute,
  type DynamicCssAttribute,
  type DynamicParams,
  type ThemeAttributeDefinition,
  type ResolvedAttribute,
  type SerializedTheme,
  type SerializedAttribute,
  type LegacyTheme,
  // engine class + singleton
  ThemeEngine,
  getThemeEngine,
  createDefaultAttributes,
} from "./theme-engine";

import {
  getThemeEngine,
  hexToHSLString,
  type GradientConfig,
  type TextureConfig,
  type GlassConfig,
  type HarmonyMode,
} from "./theme-engine";

// ── Legacy type aliases ──────────────────────────

/**
 * All CSS custom properties that make up a Lavarrock theme.
 * Now dynamically derived from the engine's attribute registry.
 */
export function getThemeVariables() {
  const engine = getThemeEngine();
  return engine
    .getAttributes()
    .filter((a) => a.group !== "Effects")
    .map((a) => ({ key: a.key, label: a.label, group: a.group }));
}

/** Keep the old THEME_VARIABLES constant for any remaining direct references */
export const THEME_VARIABLES = [
  { key: "background", label: "Background", group: "Base" },
  { key: "foreground", label: "Foreground", group: "Base" },
  { key: "card", label: "Card", group: "Surfaces" },
  { key: "card-foreground", label: "Card Foreground", group: "Surfaces" },
  { key: "popover", label: "Popover", group: "Surfaces" },
  { key: "popover-foreground", label: "Popover Foreground", group: "Surfaces" },
  { key: "primary", label: "Primary", group: "Brand" },
  { key: "primary-foreground", label: "Primary Foreground", group: "Brand" },
  { key: "secondary", label: "Secondary", group: "Brand" },
  {
    key: "secondary-foreground",
    label: "Secondary Foreground",
    group: "Brand",
  },
  { key: "accent", label: "Accent", group: "Brand" },
  { key: "accent-foreground", label: "Accent Foreground", group: "Brand" },
  { key: "muted", label: "Muted", group: "Neutral" },
  { key: "muted-foreground", label: "Muted Foreground", group: "Neutral" },
  { key: "destructive", label: "Destructive", group: "Feedback" },
  {
    key: "destructive-foreground",
    label: "Destructive Foreground",
    group: "Feedback",
  },
  { key: "border", label: "Border", group: "Neutral" },
  { key: "input", label: "Input", group: "Neutral" },
  { key: "ring", label: "Ring", group: "Neutral" },
  { key: "tablist", label: "Tab List", group: "Chrome" },
  { key: "tab-icon", label: "Tab Icon", group: "Chrome" },
  { key: "tab-icon-active", label: "Tab Icon Active", group: "Chrome" },
] as const;

export type ThemeVariableKey = (typeof THEME_VARIABLES)[number]["key"];

/** A full theme is a map from variable key to HSL string */
export type ThemeValues = Record<ThemeVariableKey, string>;

/** Wheel configuration persisted with a theme (legacy shape) */
export interface WheelConfig {
  hues: number[];
  harmony: HarmonyMode;
  mode: "dark" | "light";
  vibrancy: number;
  lightness: number;
  gradient: GradientConfig;
  texture: TextureConfig;
  glass: GlassConfig;
}

/** Theme stored on backend */
export interface SavedTheme {
  name: string;
  theme: Record<string, any>;
  active: boolean;
}

// ── Legacy API functions (delegate to engine) ────

/**
 * Generate a full theme from hues + mode + vibrancy.
 * Now delegates to the engine's resolution pipeline.
 */
export function generateThemeFromColors(
  hues: number[],
  mode: "dark" | "light" = "dark",
  vibrancy = 0.5,
  lightness = 0.5,
): ThemeValues {
  const engine = getThemeEngine();
  engine.setInputs({ hues, mode, vibrancy, lightness });
  // Reset attributes to dynamic defaults so we get fresh computations
  engine.resetToDefaults();
  const colors = engine.resolveColorValues() as ThemeValues;
  return colors;
}

/** Apply flat ThemeValues to the DOM (CSS custom properties on :root) */
export function applyThemeValues(values: ThemeValues): void {
  const root = document.documentElement;
  for (const v of THEME_VARIABLES) {
    if (values[v.key]) {
      root.style.setProperty(`--${v.key}`, values[v.key]);
    }
  }
}

/** Apply the full engine state (colours + effects) to the DOM */
export function applyEngineToDOM(): void {
  getThemeEngine().applyToDOM();
}

/** Read current CSS variable values from the DOM */
export function readCurrentThemeFromDOM(): ThemeValues {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const values: Record<string, string> = {};
  for (const v of THEME_VARIABLES) {
    values[v.key] = style.getPropertyValue(`--${v.key}`).trim() || "0 0% 0%";
  }
  return values as ThemeValues;
}

// ── Gradient / Texture (legacy wrappers) ─────────

export function applyGradient(
  config: GradientConfig,
  hues: number[],
  mode: "dark" | "light",
): void {
  const engine = getThemeEngine();
  engine.setInputs({ gradient: config, hues, mode });
  engine.applyToDOM();
}

export function applyTexture(config: TextureConfig): void {
  const engine = getThemeEngine();
  engine.setInputs({ texture: config });
  engine.applyToDOM();
}

// ── VSCode theme import ──────────────────────────

interface VSCodeTheme {
  colors?: Record<string, string>;
  tokenColors?: unknown[];
}

function adjustBorderContrast(bgHex: string, borderHex: string): string {
  const bgR = parseInt(bgHex.substring(1, 3), 16) / 255;
  const bgG = parseInt(bgHex.substring(3, 5), 16) / 255;
  const bgB = parseInt(bgHex.substring(5, 7), 16) / 255;
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
  let bR = parseInt(borderHex.substring(1, 3), 16);
  let bG = parseInt(borderHex.substring(3, 5), 16);
  let bB = parseInt(borderHex.substring(5, 7), 16);
  const adj = bgLum < 0.5 ? 60 : -60;
  bR = Math.max(0, Math.min(255, bR + adj));
  bG = Math.max(0, Math.min(255, bG + adj));
  bB = Math.max(0, Math.min(255, bB + adj));
  return `#${bR.toString(16).padStart(2, "0")}${bG.toString(16).padStart(2, "0")}${bB.toString(16).padStart(2, "0")}`;
}

function stripAlpha(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length === 8) hex = hex.substring(0, 6);
  if (hex.length === 4) hex = hex.substring(0, 3);
  return `#${hex}`;
}

export function mapVSCodeTheme(vscodeTheme: VSCodeTheme): ThemeValues {
  const c = vscodeTheme.colors || {};
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      if (c[k]) return stripAlpha(c[k]);
    }
    return undefined;
  };

  const background = get("editor.background", "background") || "#1e1e1e";
  const foreground = get("editor.foreground", "foreground") || "#d4d4d4";
  const primary =
    get(
      "button.background",
      "activityBarBadge.background",
      "activityBar.background",
    ) || "#007acc";
  const primaryFg =
    get("button.foreground", "activityBarBadge.foreground") || foreground;
  const secondary =
    get(
      "sideBar.background",
      "editorGroupHeader.tabsBackground",
      "panel.background",
    ) || "#252526";
  const secondaryFg =
    get("sideBar.foreground", "panel.foreground") || foreground;
  const accent =
    get(
      "list.activeSelectionBackground",
      "list.inactiveSelectionBackground",
      "focusBorder",
    ) || primary;
  const accentFg =
    get("list.activeSelectionForeground", "list.inactiveSelectionForeground") ||
    foreground;
  const muted =
    get("editorWidget.background", "dropdown.background", "input.background") ||
    "#3c3c3c";
  const mutedFg =
    get(
      "descriptionForeground",
      "editorLineNumber.foreground",
      "tab.inactiveForeground",
    ) || "#888888";
  const tabList =
    get(
      "sideBarSectionHeader.background",
      "editorGroupHeader.tabsBackground",
      "tab.inactiveBackground",
      "sideBar.background",
    ) || muted;
  const tabIcon =
    get("tab.inactiveForeground", "sideBar.foreground") || foreground;
  const tabIconActive =
    get("tab.activeForeground", "list.activeSelectionForeground") || foreground;
  let border =
    get(
      "panel.border",
      "editorGroup.border",
      "tab.border",
      "sideBar.border",
      "contrastBorder",
    ) || "#444444";
  border = adjustBorderContrast(background, border);
  const card =
    get(
      "editorGroupHeader.tabsBackground",
      "tab.inactiveBackground",
      "sideBar.background",
    ) || secondary;
  const cardFg =
    get("tab.inactiveForeground", "sideBar.foreground") || foreground;
  const destructive =
    get("errorForeground", "editorError.foreground") || "#f44747";
  const destructiveFg = get("errorForeground") || foreground;
  const popover =
    get(
      "editorHoverWidget.background",
      "editorWidget.background",
      "dropdown.background",
    ) || card;
  const popoverFg =
    get(
      "editorHoverWidget.foreground",
      "editorWidget.foreground",
      "dropdown.foreground",
    ) || foreground;
  const ring = get("focusBorder") || accent;
  const input = get("input.background", "dropdown.background") || muted;

  return {
    background: hexToHSLString(background),
    foreground: hexToHSLString(foreground),
    card: hexToHSLString(card),
    "card-foreground": hexToHSLString(cardFg),
    popover: hexToHSLString(popover),
    "popover-foreground": hexToHSLString(popoverFg),
    primary: hexToHSLString(primary),
    "primary-foreground": hexToHSLString(primaryFg),
    secondary: hexToHSLString(secondary),
    "secondary-foreground": hexToHSLString(secondaryFg),
    accent: hexToHSLString(accent),
    "accent-foreground": hexToHSLString(accentFg),
    muted: hexToHSLString(muted),
    "muted-foreground": hexToHSLString(mutedFg),
    destructive: hexToHSLString(destructive),
    "destructive-foreground": hexToHSLString(destructiveFg),
    border: hexToHSLString(border),
    input: hexToHSLString(input),
    ring: hexToHSLString(ring),
    tablist: hexToHSLString(tabList),
    "tab-icon": hexToHSLString(tabIcon),
    "tab-icon-active": hexToHSLString(tabIconActive),
  };
}

// ── Theme manager API ────────────────────────────

export interface ThemeManagerAPI {
  /** Get the current working theme values */
  getValues: () => ThemeValues;
  /** Set a single variable */
  setVariable: (key: ThemeVariableKey, hslValue: string) => void;
  /** Set all variables at once (e.g. from import) */
  setAllVariables: (values: ThemeValues) => void;
  /** Register an extension panel (e.g. import button) */
  registerExtension: (ext: ThemeExtension) => () => void;
  /** Get registered extensions */
  getExtensions: () => ThemeExtension[];
  /** Access the underlying theme engine */
  getEngine: () => ReturnType<typeof getThemeEngine>;
  /** Register custom theme attributes (returns unregister fn) */
  registerAttributes: (
    defs: import("./theme-engine").ThemeAttributeDefinition[],
  ) => () => void;
}

export interface ThemeExtension {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  render: () => React.ReactElement;
}

declare global {
  interface Window {
    __LAVARROCK_THEME_MANAGER?: ThemeManagerAPI;
  }
}
