/**
 * Lavarrock Theme Engine
 *
 * Deep attribute-based theme system. Each theme attribute has a type
 * and properties that define how its value is computed.
 *
 * Attribute types:
 *   hex         — static hex color string, e.g. "#282c34"
 *   css         — static CSS value string, e.g. "220 15% 8%"
 *   dynamic_hex — hex computed from theme inputs (hues, vibrancy, mode)
 *   dynamic_css — CSS value computed from theme inputs; can include
 *                 gradients, textures, or complex expressions
 *
 * The ThemeEngine holds a registry of attribute definitions. Plugins
 * can extend it by registering new attributes at runtime.
 */

// ── Colour helpers (standalone, no imports needed) ──

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace("#", "");
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function toHSLString(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

export function parseHSLString(hsl: string): {
  h: number;
  s: number;
  l: number;
} {
  const parts = hsl.replace(/%/g, "").split(/\s+/).map(Number);
  return { h: parts[0] || 0, s: parts[1] || 0, l: parts[2] || 0 };
}

export function hslStringToHex(hsl: string): string {
  const { h, s, l } = parseHSLString(hsl);
  return hslToHex(h, s, l);
}

export function hexToHSLString(hex: string): string {
  const { h, s, l } = hexToHSL(hex);
  return toHSLString(h, s, l);
}

// ── Harmony modes ────────────────────────────────

export type HarmonyMode =
  | "monochromatic"
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic";

export const HARMONY_MODES: {
  value: HarmonyMode;
  label: string;
  count: number;
}[] = [
  { value: "monochromatic", label: "Mono", count: 1 },
  { value: "complementary", label: "Complement", count: 2 },
  { value: "analogous", label: "Analogous", count: 3 },
  { value: "triadic", label: "Triadic", count: 3 },
  { value: "split-complementary", label: "Split", count: 3 },
  { value: "tetradic", label: "Tetradic", count: 4 },
];

/** Given a primary hue and a harmony mode, derive the full hue array. */
export function computeHarmonyHues(
  primary: number,
  harmony: HarmonyMode,
): number[] {
  const p = ((primary % 360) + 360) % 360;
  switch (harmony) {
    case "monochromatic":
      return [p];
    case "complementary":
      return [p, (p + 180) % 360];
    case "analogous":
      return [p, (p + 30) % 360, (p + 330) % 360];
    case "triadic":
      return [p, (p + 120) % 360, (p + 240) % 360];
    case "split-complementary":
      return [p, (p + 150) % 360, (p + 210) % 360];
    case "tetradic":
      return [p, (p + 90) % 360, (p + 180) % 360, (p + 270) % 360];
  }
}

// ── Theme input context ──────────────────────────

/** The parameters that dynamic attributes receive to compute their value. */
export interface ThemeInputs {
  /** Primary hue(s) — 1-4 entries, degrees 0-360 */
  hues: number[];
  /** Colour harmony mode */
  harmony: HarmonyMode;
  /** Dark or light mode */
  mode: "dark" | "light";
  /** Colour richness 0-1 */
  vibrancy: number;
  /** Overall lightness 0-1 (0 = darkest, 1 = lightest) */
  lightness: number;
  /** Gradient config */
  gradient: GradientConfig;
  /** Texture config */
  texture: TextureConfig;
  /** Glass / frosted-glass config */
  glass: GlassConfig;
}

export interface GradientConfig {
  enabled: boolean;
  angle: number;
  strength: number;
}

export interface TextureConfig {
  opacity: number;
}

export interface GlassConfig {
  enabled: boolean;
  /** Blur radius in px (4-24 typical) */
  blur: number;
  /** Surface opacity 0-1 (lower = more transparent) */
  opacity: number;
}

/** Convenience derived values from the raw inputs */
export interface DerivedInputs extends ThemeInputs {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  v: number;
  /** Overall lightness 0-1 */
  l: number;
  isDark: boolean;
}

function deriveInputs(inputs: ThemeInputs): DerivedInputs {
  const h1 = inputs.hues[0] ?? 220;
  const h2 = inputs.hues[1] ?? (h1 + 30) % 360;
  const h3 = inputs.hues[2] ?? (h1 + 180) % 360;
  const h4 = inputs.hues[3] ?? (h1 + 270) % 360;
  return {
    ...inputs,
    h1,
    h2,
    h3,
    h4,
    v: inputs.vibrancy,
    l: inputs.lightness,
    isDark: inputs.mode === "dark",
  };
}

// ── Attribute type definitions ───────────────────

/** Static hex colour */
export interface HexAttribute {
  type: "hex";
  value: string; // e.g. "#282c34"
}

/** Static CSS value (typically an HSL string for a CSS var) */
export interface CssAttribute {
  type: "css";
  value: string; // e.g. "220 15% 8%"
}

/**
 * Dynamic hex — computed at resolve time.
 * `compute` receives theme inputs & returns a hex string.
 * `params` is a human-readable description of inputs used.
 */
export interface DynamicHexAttribute {
  type: "dynamic_hex";
  params: DynamicParams;
  compute: (d: DerivedInputs) => string;
}

/**
 * Dynamic CSS — computed at resolve time.
 * Can produce any CSS value: HSL string, gradient, complex expressions.
 */
export interface DynamicCssAttribute {
  type: "dynamic_css";
  params: DynamicParams;
  compute: (d: DerivedInputs) => string;
}

/** Describes which inputs a dynamic attribute depends on */
export interface DynamicParams {
  /** Which hue index (0 = primary, 1 = secondary, 2 = tertiary) */
  hue?: number;
  /** Whether vibrancy affects this attribute */
  usesVibrancy?: boolean;
  /** Whether gradient config affects this attribute */
  usesGradient?: boolean;
  /** Whether texture config affects this attribute */
  usesTexture?: boolean;
  /** Whether glass config affects this attribute */
  usesGlass?: boolean;
  /** Free-form description of the computation */
  description?: string;
}

export type ThemeAttribute =
  | HexAttribute
  | CssAttribute
  | DynamicHexAttribute
  | DynamicCssAttribute;

// ── Attribute definition (what gets registered) ──

export interface ThemeAttributeDefinition {
  /** CSS custom property name (without --), e.g. "background" */
  key: string;
  /** Human-readable label */
  label: string;
  /** Grouping category */
  group: string;
  /** The attribute specification */
  attribute: ThemeAttribute;
}

// ── Resolved value (what gets applied to the DOM) ─

export interface ResolvedAttribute {
  key: string;
  label: string;
  group: string;
  /** The final CSS value to set on the custom property */
  cssValue: string;
  /** Hex representation for colour pickers (only meaningful for colour attributes) */
  hexValue: string;
  /** The original attribute type */
  type: ThemeAttribute["type"];
}

// ── Default attribute definitions ────────────────

/**
 * Helper to create a dynamic_css attribute that outputs an HSL string
 * for a CSS custom property.
 */
function dynamicHSL(
  hue: number,
  computeSat: (d: DerivedInputs) => number,
  computeLight: (d: DerivedInputs) => number,
  params?: Partial<DynamicParams>,
): DynamicCssAttribute {
  return {
    type: "dynamic_css",
    params: { hue, usesVibrancy: true, ...params },
    compute: (d) => {
      const h = hue === 0 ? d.h1 : hue === 1 ? d.h2 : d.h3;
      return toHSLString(h, computeSat(d), computeLight(d));
    },
  };
}

/**
 * All built-in theme attributes. Every one is dynamic_css so they
 * respond to hue, mode, and vibrancy changes.
 */
export function createDefaultAttributes(): ThemeAttributeDefinition[] {
  // Helper: shift a base lightness value by the lightness input.
  // d.l = 0 → darker, d.l = 0.5 → neutral, d.l = 1 → lighter
  // `range` controls how many lightness-% units d.l can add/subtract
  const lShift = (base: number, d: DerivedInputs, range = 8) =>
    base + (d.l - 0.5) * range * 2;

  return [
    // ── Base ──
    {
      key: "background",
      label: "Background",
      group: "Base",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 22 : 8 + d.v * 25),
        (d) => (d.isDark ? lShift(8 + d.v * 2, d, 6) : lShift(96, d, 4)),
      ),
    },
    {
      key: "foreground",
      label: "Foreground",
      group: "Base",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 8 : 6 + d.v * 12),
        (d) => (d.isDark ? lShift(90, d, -4) : lShift(10, d, 4)),
      ),
    },
    // ── Surfaces ──
    {
      key: "card",
      label: "Card",
      group: "Surfaces",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? (4 + d.v * 22) * 0.8 : (8 + d.v * 25) * 0.75),
        (d) => (d.isDark ? lShift(10 + d.v * 2, d, 6) : lShift(95, d, 4)),
      ),
    },
    {
      key: "card-foreground",
      label: "Card Foreground",
      group: "Surfaces",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 8 : 6 + d.v * 12),
        (d) => (d.isDark ? lShift(90, d, -4) : lShift(10, d, 4)),
      ),
    },
    {
      key: "popover",
      label: "Popover",
      group: "Surfaces",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? (4 + d.v * 22) * 0.9 : (8 + d.v * 25) * 0.9),
        (d) => (d.isDark ? lShift(12 + d.v * 2, d, 6) : lShift(97, d, 3)),
      ),
    },
    {
      key: "popover-foreground",
      label: "Popover Foreground",
      group: "Surfaces",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 8 : 6 + d.v * 12),
        (d) => (d.isDark ? lShift(90, d, -4) : lShift(10, d, 4)),
      ),
    },
    // ── Brand ──
    {
      key: "primary",
      label: "Primary",
      group: "Brand",
      attribute: dynamicHSL(
        1,
        (d) => (d.isDark ? 30 + d.v * 50 : 30 + d.v * 45),
        (d) =>
          d.isDark ? lShift(50 + d.v * 8, d, 6) : lShift(42 + d.v * 6, d, 6),
      ),
    },
    {
      key: "primary-foreground",
      label: "Primary Foreground",
      group: "Brand",
      attribute: dynamicHSL(
        1,
        (d) => 6 + d.v * 6,
        () => 98,
      ),
    },
    {
      key: "secondary",
      label: "Secondary",
      group: "Brand",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? (4 + d.v * 22) * 0.8 : (8 + d.v * 25) * 0.75),
        (d) => (d.isDark ? lShift(16 + d.v * 4, d, 6) : lShift(91, d, 4)),
      ),
    },
    {
      key: "secondary-foreground",
      label: "Secondary Foreground",
      group: "Brand",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 8 : 6 + d.v * 12),
        (d) => (d.isDark ? lShift(85, d, -4) : lShift(15, d, 4)),
      ),
    },
    {
      key: "accent",
      label: "Accent",
      group: "Brand",
      attribute: dynamicHSL(
        1,
        (d) => (d.isDark ? 15 + d.v * 40 : 15 + d.v * 35),
        (d) =>
          d.isDark ? lShift(22 + d.v * 6, d, 6) : lShift(88 + d.v * 4, d, 4),
      ),
    },
    {
      key: "accent-foreground",
      label: "Accent Foreground",
      group: "Brand",
      attribute: dynamicHSL(
        1,
        (d) => (d.isDark ? 8 + d.v * 10 : 15 + d.v * 30),
        (d) => (d.isDark ? lShift(90, d, -4) : lShift(25, d, 4)),
      ),
    },
    // ── Neutral ──
    {
      key: "muted",
      label: "Muted",
      group: "Neutral",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? (4 + d.v * 22) * 0.65 : (8 + d.v * 25) * 0.6),
        (d) => (d.isDark ? lShift(14 + d.v * 4, d, 6) : lShift(91, d, 4)),
      ),
    },
    {
      key: "muted-foreground",
      label: "Muted Foreground",
      group: "Neutral",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 6 : 4 + d.v * 8),
        (d) => (d.isDark ? lShift(55, d, -4) : lShift(45, d, 4)),
      ),
    },
    {
      key: "border",
      label: "Border",
      group: "Neutral",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? (6 + d.v * 24) * 0.6 : 6 + d.v * 20),
        (d) => (d.isDark ? lShift(18 + d.v * 4, d, 6) : lShift(86, d, 4)),
      ),
    },
    {
      key: "input",
      label: "Input",
      group: "Neutral",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? (6 + d.v * 24) * 0.6 : 6 + d.v * 20),
        (d) => (d.isDark ? lShift(18 + d.v * 4, d, 6) : lShift(86, d, 4)),
      ),
    },
    {
      key: "ring",
      label: "Ring",
      group: "Neutral",
      attribute: dynamicHSL(
        1,
        (d) => (d.isDark ? 25 + d.v * 40 : 25 + d.v * 40),
        (d) => (d.isDark ? lShift(50, d, 6) : lShift(45, d, 6)),
      ),
    },
    // ── Feedback ──
    {
      key: "destructive",
      label: "Destructive",
      group: "Feedback",
      attribute: {
        type: "dynamic_css",
        params: {
          usesVibrancy: true,
          description: "Red hue, vibrancy-scaled saturation",
        },
        compute: (d) =>
          toHSLString(
            0,
            d.isDark ? 40 + d.v * 35 : 45 + d.v * 35,
            d.isDark ? 50 : 55,
          ),
      },
    },
    {
      key: "destructive-foreground",
      label: "Destructive Foreground",
      group: "Feedback",
      attribute: {
        type: "dynamic_css",
        params: { usesVibrancy: true },
        compute: (d) => toHSLString(0, 6 + d.v * 6, 98),
      },
    },
    // ── Chrome ──
    {
      key: "tablist",
      label: "Tab List",
      group: "Chrome",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 6 + d.v * 24 : 6 + d.v * 20),
        (d) => (d.isDark ? lShift(6 + d.v * 2, d, 5) : lShift(93, d, 4)),
      ),
    },
    {
      key: "tab-icon",
      label: "Tab Icon",
      group: "Chrome",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 6 : 4 + d.v * 8),
        (d) => (d.isDark ? lShift(45, d, -4) : lShift(50, d, 4)),
      ),
    },
    {
      key: "tab-icon-active",
      label: "Tab Icon Active",
      group: "Chrome",
      attribute: dynamicHSL(
        0,
        (d) => (d.isDark ? 4 + d.v * 8 : 6 + d.v * 12),
        (d) => (d.isDark ? lShift(90, d, -4) : lShift(10, d, 4)),
      ),
    },
    // ── Effects (dynamic_css using gradient / texture) ──
    {
      key: "gradient-bg",
      label: "Gradient Background",
      group: "Effects",
      attribute: {
        type: "dynamic_css",
        params: {
          hue: 0,
          usesGradient: true,
          description: "Body background gradient",
        },
        compute: (d) => {
          if (!d.gradient.enabled || d.gradient.strength <= 0) return "none";
          const str = d.gradient.strength;
          const hueShift = str * 30;
          const toH = (d.h1 + hueShift) % 360;
          if (d.isDark) {
            const fromL = 6 + str * 10;
            const toL = 3 + str * 5;
            const fromS = 20 + str * 25;
            const toS = 15 + str * 20;
            return `linear-gradient(${d.gradient.angle}deg, hsl(${d.h1},${fromS}%,${fromL}%), hsl(${toH},${toS}%,${toL}%))`;
          }
          const fromL = 99 - str * 6;
          const toL = 96 - str * 5;
          const fromS = 25 + str * 20;
          const toS = 20 + str * 15;
          return `linear-gradient(${d.gradient.angle}deg, hsl(${d.h1},${fromS}%,${fromL}%), hsl(${toH},${toS}%,${toL}%))`;
        },
      },
    },
    {
      key: "gradient-alpha",
      label: "Gradient Surface Alpha",
      group: "Effects",
      attribute: {
        type: "dynamic_css",
        params: {
          usesGradient: true,
          description: "Surface transparency when gradient is active",
        },
        compute: (d) => {
          if (!d.gradient.enabled) return "1";
          return d.isDark ? "0.82" : "0.75";
        },
      },
    },
    {
      key: "texture-opacity",
      label: "Texture Opacity",
      group: "Effects",
      attribute: {
        type: "dynamic_css",
        params: { usesTexture: true, description: "Noise overlay opacity" },
        compute: (d) => String(d.texture.opacity),
      },
    },
    // ── Glass / frosted-glass effect ──
    {
      key: "glass-blur",
      label: "Glass Blur",
      group: "Effects",
      attribute: {
        type: "dynamic_css",
        params: {
          usesGlass: true,
          description: "Backdrop blur radius for glass surfaces",
        },
        compute: (d) => (d.glass.enabled ? `${d.glass.blur}px` : "0px"),
      },
    },
    {
      key: "glass-opacity",
      label: "Glass Opacity",
      group: "Effects",
      attribute: {
        type: "dynamic_css",
        params: {
          usesGlass: true,
          description: "Surface background opacity for glass effect",
        },
        compute: (d) => (d.glass.enabled ? String(d.glass.opacity) : "1"),
      },
    },
    {
      key: "glass-border",
      label: "Glass Border",
      group: "Effects",
      attribute: {
        type: "dynamic_css",
        params: {
          usesGlass: true,
          description: "Subtle border for glass surfaces",
        },
        compute: (d) => {
          if (!d.glass.enabled) return "0";
          return d.isDark ? "1px" : "1px";
        },
      },
    },
  ];
}

// ── The Theme Engine ─────────────────────────────

export class ThemeEngine {
  private _attributes = new Map<string, ThemeAttributeDefinition>();
  private _inputs: ThemeInputs;
  private _listeners = new Set<() => void>();

  constructor(initialInputs?: Partial<ThemeInputs>) {
    this._inputs = {
      hues: [220],
      harmony: "analogous",
      mode: "dark",
      vibrancy: 0.5,
      lightness: 0.5,
      gradient: { enabled: false, angle: 135, strength: 0.4 },
      texture: { opacity: 0 },
      glass: { enabled: false, blur: 12, opacity: 0.7 },
      ...initialInputs,
    };

    // Register all default attributes
    for (const def of createDefaultAttributes()) {
      this._attributes.set(def.key, def);
    }
  }

  // ── Inputs ──

  get inputs(): Readonly<ThemeInputs> {
    return this._inputs;
  }

  setInputs(patch: Partial<ThemeInputs>): void {
    this._inputs = { ...this._inputs, ...patch };
    this._notify();
  }

  // ── Attribute registry ──

  /** Register (or override) a theme attribute. Returns an unregister function. */
  registerAttribute(def: ThemeAttributeDefinition): () => void {
    this._attributes.set(def.key, def);
    this._notify();
    return () => {
      this._attributes.delete(def.key);
      this._notify();
    };
  }

  /** Register multiple attributes at once */
  registerAttributes(defs: ThemeAttributeDefinition[]): () => void {
    for (const def of defs) {
      this._attributes.set(def.key, def);
    }
    this._notify();
    return () => {
      for (const def of defs) {
        this._attributes.delete(def.key);
      }
      this._notify();
    };
  }

  /** Get a single attribute definition */
  getAttribute(key: string): ThemeAttributeDefinition | undefined {
    return this._attributes.get(key);
  }

  /** Get all attribute definitions */
  getAttributes(): ThemeAttributeDefinition[] {
    return Array.from(this._attributes.values());
  }

  /** Get attribute definitions grouped by group name */
  getGroupedAttributes(): Record<string, ThemeAttributeDefinition[]> {
    const groups: Record<string, ThemeAttributeDefinition[]> = {};
    for (const def of this._attributes.values()) {
      if (!groups[def.group]) groups[def.group] = [];
      groups[def.group].push(def);
    }
    return groups;
  }

  // ── Resolution ──

  /** Resolve a single attribute to its final CSS + hex values */
  resolveAttribute(def: ThemeAttributeDefinition): ResolvedAttribute {
    const d = deriveInputs(this._inputs);
    const attr = def.attribute;
    let cssValue: string;
    let hexValue: string;

    switch (attr.type) {
      case "hex":
        cssValue = hexToHSLString(attr.value);
        hexValue = attr.value;
        break;
      case "css":
        cssValue = attr.value;
        hexValue = hslStringToHex(attr.value);
        break;
      case "dynamic_hex": {
        hexValue = attr.compute(d);
        cssValue = hexToHSLString(hexValue);
        break;
      }
      case "dynamic_css": {
        cssValue = attr.compute(d);
        // Only convert to hex if it looks like an HSL string
        const parts = cssValue.replace(/%/g, "").split(/\s+/).map(Number);
        if (
          parts.length === 3 &&
          !isNaN(parts[0]) &&
          !isNaN(parts[1]) &&
          !isNaN(parts[2])
        ) {
          hexValue = hslToHex(parts[0], parts[1], parts[2]);
        } else {
          // Complex value (gradient, opacity, etc.) — no hex representation
          hexValue = "";
        }
        break;
      }
    }

    return {
      key: def.key,
      label: def.label,
      group: def.group,
      cssValue,
      hexValue,
      type: attr.type,
    };
  }

  /** Resolve all attributes → flat map of key → CSS value */
  resolveAll(): Record<string, ResolvedAttribute> {
    const result: Record<string, ResolvedAttribute> = {};
    for (const def of this._attributes.values()) {
      result[def.key] = this.resolveAttribute(def);
    }
    return result;
  }

  /** Resolve only colour attributes (skip effects) → ThemeValues compatible format */
  resolveColorValues(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const def of this._attributes.values()) {
      if (def.group === "Effects") continue;
      const resolved = this.resolveAttribute(def);
      result[def.key] = resolved.cssValue;
    }
    return result;
  }

  // ── DOM application ──

  /** Apply all resolved colour attributes as CSS custom properties on :root */
  applyToDOM(): void {
    const root = document.documentElement;
    const resolved = this.resolveAll();

    for (const [key, attr] of Object.entries(resolved)) {
      if (attr.group === "Effects") continue; // effects handled separately
      root.style.setProperty(`--${key}`, attr.cssValue);
    }

    // Apply effects
    this._applyGradient(resolved);
    this._applyTexture(resolved);
    this._applyGlass(resolved);
  }

  private _applyGlass(resolved: Record<string, ResolvedAttribute>): void {
    const appRoot = document.getElementById("lavarrock-root");
    const blur = resolved["glass-blur"]?.cssValue ?? "0px";
    const opacity = resolved["glass-opacity"]?.cssValue ?? "1";
    const borderW = resolved["glass-border"]?.cssValue ?? "0";
    const enabled = this._inputs.glass.enabled;
    const styleId = "lavarrock-glass-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!enabled || blur === "0px") {
      if (appRoot) appRoot.removeAttribute("data-glass");
      if (styleEl) styleEl.remove();
      return;
    }

    if (appRoot) appRoot.setAttribute("data-glass", "true");

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const alpha = parseFloat(opacity);
    const isDark = this._inputs.mode === "dark";
    const borderColor = isDark
      ? `rgba(255,255,255,${0.08 + alpha * 0.04})`
      : `rgba(0,0,0,${0.06 + alpha * 0.03})`;
    const highlightColor = isDark
      ? `rgba(255,255,255,${0.03 + (1 - alpha) * 0.05})`
      : `rgba(255,255,255,${0.4 + (1 - alpha) * 0.3})`;

    styleEl.textContent = `
      [data-glass] .bg-card,
      [data-glass] .bg-popover,
      [data-glass] .bg-muted,
      [data-glass] .bg-secondary {
        background-color: hsl(var(--card) / ${alpha}) !important;
        backdrop-filter: blur(${blur}) saturate(1.4) !important;
        -webkit-backdrop-filter: blur(${blur}) saturate(1.4) !important;
        border: ${borderW} solid ${borderColor} !important;
        box-shadow: inset 0 1px 0 0 ${highlightColor} !important;
      }
      [data-glass] .bg-popover {
        background-color: hsl(var(--popover) / ${alpha}) !important;
      }
      [data-glass] .bg-muted {
        background-color: hsl(var(--muted) / ${alpha}) !important;
      }
      [data-glass] .bg-secondary {
        background-color: hsl(var(--secondary) / ${alpha}) !important;
      }
      [data-glass] .bg-background {
        background-color: hsl(var(--background) / ${Math.min(alpha + 0.15, 1)}) !important;
        backdrop-filter: blur(${blur}) !important;
        -webkit-backdrop-filter: blur(${blur}) !important;
      }
    `;
  }

  private _applyGradient(resolved: Record<string, ResolvedAttribute>): void {
    const appRoot = document.getElementById("lavarrock-root");
    const gradientBg = resolved["gradient-bg"]?.cssValue ?? "none";
    const gradientAlpha = resolved["gradient-alpha"]?.cssValue ?? "1";

    if (gradientBg === "none" || !this._inputs.gradient.enabled) {
      document.body.style.backgroundImage = "";
      if (appRoot) appRoot.removeAttribute("data-gradient");
      const existing = document.getElementById("lavarrock-gradient-style");
      if (existing) existing.remove();
      return;
    }

    document.body.style.backgroundImage = gradientBg;
    document.body.style.backgroundAttachment = "fixed";
    if (appRoot) appRoot.setAttribute("data-gradient", "true");

    const alpha = parseFloat(gradientAlpha);
    const styleId = "lavarrock-gradient-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      [data-gradient] {
        background-color: transparent !important;
      }
      [data-gradient] .bg-background {
        background-color: hsl(var(--background) / ${alpha}) !important;
      }
      [data-gradient] .bg-card {
        background-color: hsl(var(--card) / ${alpha}) !important;
      }
      [data-gradient] .bg-popover {
        background-color: hsl(var(--popover) / ${alpha}) !important;
      }
      [data-gradient] .bg-muted {
        background-color: hsl(var(--muted) / ${alpha}) !important;
      }
      [data-gradient] .bg-secondary {
        background-color: hsl(var(--secondary) / ${alpha}) !important;
      }
    `;
  }

  private _applyTexture(resolved: Record<string, ResolvedAttribute>): void {
    const opacity = parseFloat(resolved["texture-opacity"]?.cssValue ?? "0");
    const overlayId = "lavarrock-texture-overlay";
    let overlay = document.getElementById(overlayId);

    if (opacity <= 0) {
      if (overlay) overlay.style.opacity = "0";
      return;
    }

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = overlayId;
      Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "9999",
        pointerEvents: "none",
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
        mixBlendMode: "overlay",
        transition: "opacity 0.15s ease",
      });
      overlay.style.backgroundImage = `url(${getNoiseDataUrl()})`;
      document.body.appendChild(overlay);
    }

    overlay.style.opacity = String(opacity);
  }

  // ── Serialisation (save / load) ──

  /**
   * Serialise the current theme to a persistable object.
   * Stores both the resolved colour values AND the inputs so we can
   * recreate the dynamic state on load.
   */
  serialize(): SerializedTheme {
    const attributes: Record<string, SerializedAttribute> = {};
    for (const def of this._attributes.values()) {
      const resolved = this.resolveAttribute(def);
      attributes[def.key] = {
        type: def.attribute.type,
        group: def.group,
        label: def.label,
        value: resolved.cssValue,
        ...(resolved.hexValue ? { hex: resolved.hexValue } : {}),
      };
    }
    return {
      version: 2,
      inputs: { ...this._inputs },
      attributes,
      // Keep flat colours for backwards compat with frontend loadActiveTheme
      colors: this.resolveColorValues(),
    };
  }

  /**
   * Load a serialised theme. Restores inputs and re-resolves all attributes.
   * Static overrides in the saved attributes are applied on top of dynamic
   * computation.
   */
  deserialize(theme: SerializedTheme | LegacyTheme): void {
    if (isSerializedTheme(theme)) {
      // V2 format
      this.setInputs(theme.inputs);
      // Apply any static overrides from saved attributes
      for (const [key, saved] of Object.entries(theme.attributes)) {
        const existing = this._attributes.get(key);
        if (existing && (saved.type === "hex" || saved.type === "css")) {
          // The user explicitly set a static value — honour it
          this._attributes.set(key, {
            ...existing,
            attribute: { type: saved.type, value: saved.value } as
              | HexAttribute
              | CssAttribute,
          });
        }
        // dynamic types are re-computed from inputs, so we don't need to store them
      }
    } else {
      // Legacy V1 format — read flat colours + wheelConfig
      const colors = theme.colors || theme;
      const wc = (theme as any).wheelConfig;
      if (wc) {
        this.setInputs({
          hues: wc.hues || [220],
          harmony: wc.harmony || "analogous",
          mode: wc.mode || "dark",
          vibrancy: wc.vibrancy ?? 0.5,
          lightness: wc.lightness ?? 0.5,
          gradient: wc.gradient || {
            enabled: false,
            angle: 135,
            strength: 0.4,
          },
          texture: wc.texture || { opacity: 0 },
          glass: wc.glass || { enabled: false, blur: 12, opacity: 0.7 },
        });
      }
      // Override each colour attribute as static css
      for (const def of this._attributes.values()) {
        if (def.group === "Effects") continue;
        const val = (colors as Record<string, string>)[def.key];
        if (val) {
          this._attributes.set(def.key, {
            ...def,
            attribute: { type: "css", value: val },
          });
        }
      }
    }
    this._notify();
  }

  /**
   * Reset all attributes back to their dynamic defaults.
   * Keeps current inputs.
   */
  resetToDefaults(): void {
    const defaults = createDefaultAttributes();
    for (const def of defaults) {
      this._attributes.set(def.key, def);
    }
    this._notify();
  }

  // ── Change subscription ──

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notify(): void {
    for (const fn of this._listeners) fn();
  }
}

// ── Serialised theme format ──────────────────────

export interface SerializedAttribute {
  type: ThemeAttribute["type"];
  group: string;
  label: string;
  /** The resolved CSS value at save time */
  value: string;
  /** Hex colour if applicable */
  hex?: string;
}

export interface SerializedTheme {
  version: 2;
  inputs: ThemeInputs;
  attributes: Record<string, SerializedAttribute>;
  /** Flat colour map for backward compat */
  colors: Record<string, string>;
}

/** Legacy format (v1) */
export interface LegacyTheme {
  colors?: Record<string, string>;
  wheelConfig?: {
    hues: number[];
    mode: "dark" | "light";
    vibrancy: number;
    gradient: GradientConfig;
    texture: TextureConfig;
  };
  [key: string]: any;
}

function isSerializedTheme(t: any): t is SerializedTheme {
  return t && t.version === 2 && t.attributes;
}

// ── Noise helper (module-scoped cache) ──────────

let _noiseDataUrl: string | null = null;

function getNoiseDataUrl(): string {
  if (_noiseDataUrl) return _noiseDataUrl;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  _noiseDataUrl = canvas.toDataURL("image/png");
  return _noiseDataUrl;
}

// ── Singleton ────────────────────────────────────

let _engine: ThemeEngine | null = null;

/** Get (or create) the global ThemeEngine singleton. */
export function getThemeEngine(
  initialInputs?: Partial<ThemeInputs>,
): ThemeEngine {
  if (!_engine) {
    _engine = new ThemeEngine(initialInputs);
  }
  return _engine;
}
