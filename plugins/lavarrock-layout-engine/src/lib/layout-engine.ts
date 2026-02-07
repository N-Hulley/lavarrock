/**
 * Layout Engine — manages CSS layout custom properties.
 *
 * Controls: border-radius, spacing scale, gaps, paddings, margins,
 * container widths, and responsive breakpoints.
 * All values are applied as CSS custom properties on :root.
 */

// ── Types ──

export interface LayoutInputs {
  /** Global border-radius multiplier (0 = sharp, 1 = default, 2 = very round) */
  radius: number;
  /** Global spacing multiplier (0.5 = compact, 1 = default, 1.5 = spacious) */
  spacing: number;
  /** Panel/pane gap in px */
  panelGap: number;
  /** Card inner padding multiplier */
  cardPadding: number;
  /** Sidebar width in px */
  sidebarWidth: number;
  /** Container max-width in px (0 = full width) */
  containerMax: number;
  /** Base font size in px */
  baseFontSize: number;
  /** Border width multiplier (0 = none, 1 = default, 2 = thick) */
  borderWidth: number;
}

export interface LayoutPreset {
  name: string;
  description: string;
  inputs: LayoutInputs;
}

// ── Defaults ──

export const DEFAULT_LAYOUT: LayoutInputs = {
  radius: 1,
  spacing: 1,
  panelGap: 8,
  cardPadding: 1,
  sidebarWidth: 240,
  containerMax: 0,
  baseFontSize: 14,
  borderWidth: 1,
};

// ── Presets ──

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    name: "Default",
    description: "Balanced defaults",
    inputs: { ...DEFAULT_LAYOUT },
  },
  {
    name: "Compact",
    description: "Dense, less whitespace",
    inputs: {
      ...DEFAULT_LAYOUT,
      radius: 0.6,
      spacing: 0.7,
      panelGap: 4,
      cardPadding: 0.7,
      sidebarWidth: 200,
      baseFontSize: 13,
    },
  },
  {
    name: "Spacious",
    description: "Airy, lots of breathing room",
    inputs: {
      ...DEFAULT_LAYOUT,
      radius: 1.2,
      spacing: 1.4,
      panelGap: 14,
      cardPadding: 1.4,
      sidebarWidth: 280,
      baseFontSize: 15,
    },
  },
  {
    name: "Sharp",
    description: "No rounded corners, tight spacing",
    inputs: {
      ...DEFAULT_LAYOUT,
      radius: 0,
      spacing: 0.85,
      panelGap: 4,
      cardPadding: 0.85,
      borderWidth: 1.2,
    },
  },
  {
    name: "Bubbly",
    description: "Extra round, playful feel",
    inputs: {
      ...DEFAULT_LAYOUT,
      radius: 2,
      spacing: 1.15,
      panelGap: 10,
      cardPadding: 1.2,
      borderWidth: 0.8,
    },
  },
  {
    name: "Minimal",
    description: "Thin borders, subtle separation",
    inputs: {
      ...DEFAULT_LAYOUT,
      radius: 0.5,
      spacing: 1,
      panelGap: 6,
      cardPadding: 1,
      borderWidth: 0.5,
      baseFontSize: 13,
    },
  },
];

// ── Derived CSS variables ──

export interface LayoutVariable {
  key: string;
  label: string;
  group: string;
  unit: string;
}

export const LAYOUT_VARIABLES: LayoutVariable[] = [
  // Radius scale
  { key: "radius", label: "Base Radius", group: "Radius", unit: "rem" },
  { key: "radius-sm", label: "Small Radius", group: "Radius", unit: "rem" },
  { key: "radius-md", label: "Medium Radius", group: "Radius", unit: "rem" },
  { key: "radius-lg", label: "Large Radius", group: "Radius", unit: "rem" },
  {
    key: "radius-xl",
    label: "Extra Large Radius",
    group: "Radius",
    unit: "rem",
  },
  { key: "radius-full", label: "Full Radius", group: "Radius", unit: "px" },
  // Spacing scale
  {
    key: "space-1",
    label: "Space 1 (4px base)",
    group: "Spacing",
    unit: "rem",
  },
  {
    key: "space-2",
    label: "Space 2 (8px base)",
    group: "Spacing",
    unit: "rem",
  },
  {
    key: "space-3",
    label: "Space 3 (12px base)",
    group: "Spacing",
    unit: "rem",
  },
  {
    key: "space-4",
    label: "Space 4 (16px base)",
    group: "Spacing",
    unit: "rem",
  },
  {
    key: "space-6",
    label: "Space 6 (24px base)",
    group: "Spacing",
    unit: "rem",
  },
  {
    key: "space-8",
    label: "Space 8 (32px base)",
    group: "Spacing",
    unit: "rem",
  },
  // Panel / layout
  { key: "panel-gap", label: "Panel Gap", group: "Layout", unit: "px" },
  { key: "card-padding", label: "Card Padding", group: "Layout", unit: "rem" },
  { key: "sidebar-width", label: "Sidebar Width", group: "Layout", unit: "px" },
  {
    key: "container-max",
    label: "Container Max Width",
    group: "Layout",
    unit: "px",
  },
  // Typography
  {
    key: "font-size-base",
    label: "Base Font Size",
    group: "Typography",
    unit: "px",
  },
  // Borders
  { key: "border-width", label: "Border Width", group: "Borders", unit: "px" },
];

// ── Engine ──

export function resolveLayoutValues(
  inputs: LayoutInputs,
): Record<string, string> {
  const r = inputs.radius;
  const s = inputs.spacing;
  const bp = inputs.borderWidth;

  return {
    // Radius scale — base is 0.5rem × multiplier
    radius: `${(0.5 * r).toFixed(3)}rem`,
    "radius-sm": `${(0.25 * r).toFixed(3)}rem`,
    "radius-md": `${(0.375 * r).toFixed(3)}rem`,
    "radius-lg": `${(0.75 * r).toFixed(3)}rem`,
    "radius-xl": `${(1 * r).toFixed(3)}rem`,
    "radius-full": "9999px",

    // Tailwind v4 base spacing unit — controls ALL gap/p/m utilities
    spacing: `${(0.25 * s).toFixed(3)}rem`,

    // Named spacing scale (for direct var() consumers)
    "space-1": `${(0.25 * s).toFixed(3)}rem`,
    "space-2": `${(0.5 * s).toFixed(3)}rem`,
    "space-3": `${(0.75 * s).toFixed(3)}rem`,
    "space-4": `${(1 * s).toFixed(3)}rem`,
    "space-6": `${(1.5 * s).toFixed(3)}rem`,
    "space-8": `${(2 * s).toFixed(3)}rem`,

    // Panel layout
    "panel-gap": `${inputs.panelGap}px`,
    "card-padding": `${(1 * inputs.cardPadding).toFixed(3)}rem`,
    "sidebar-width": `${inputs.sidebarWidth}px`,
    "container-max":
      inputs.containerMax > 0 ? `${inputs.containerMax}px` : "100%",

    // Typography
    "font-size-base": `${inputs.baseFontSize}px`,

    // Borders
    "border-width": `${(1 * bp).toFixed(2)}px`,
  };
}

export function applyLayoutToDOM(inputs: LayoutInputs): void {
  const values = resolveLayoutValues(inputs);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(values)) {
    root.style.setProperty(`--${key}`, value);
  }
}

export function readLayoutFromDOM(): Partial<Record<string, string>> {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const values: Record<string, string> = {};
  for (const v of LAYOUT_VARIABLES) {
    const val = style.getPropertyValue(`--${v.key}`).trim();
    if (val) values[v.key] = val;
  }
  return values;
}

// ── Serialization ──

export interface SerializedLayout {
  version: number;
  inputs: LayoutInputs;
}

export function serializeLayout(inputs: LayoutInputs): SerializedLayout {
  return { version: 1, inputs: { ...inputs } };
}

export function deserializeLayout(data: unknown): LayoutInputs {
  if (
    data &&
    typeof data === "object" &&
    "version" in data &&
    "inputs" in data &&
    (data as any).version === 1
  ) {
    const raw = (data as SerializedLayout).inputs;
    return {
      radius: raw.radius ?? DEFAULT_LAYOUT.radius,
      spacing: raw.spacing ?? DEFAULT_LAYOUT.spacing,
      panelGap: raw.panelGap ?? DEFAULT_LAYOUT.panelGap,
      cardPadding: raw.cardPadding ?? DEFAULT_LAYOUT.cardPadding,
      sidebarWidth: raw.sidebarWidth ?? DEFAULT_LAYOUT.sidebarWidth,
      containerMax: raw.containerMax ?? DEFAULT_LAYOUT.containerMax,
      baseFontSize: raw.baseFontSize ?? DEFAULT_LAYOUT.baseFontSize,
      borderWidth: raw.borderWidth ?? DEFAULT_LAYOUT.borderWidth,
    };
  }
  return { ...DEFAULT_LAYOUT };
}
