/**
 * Layout Manager — shared plugin (no pane).
 *
 * Registers all layout settings with the Settings Engine so they
 * appear in the centralised Settings Manager pane.
 */

import {
  type LayoutInputs,
  DEFAULT_LAYOUT,
  LAYOUT_PRESETS,
  applyLayoutToDOM,
  deserializeLayout,
} from "@lavarrock/plugin-layout-engine";
import type {
  SettingsSchema,
  SettingsFieldDef,
  SettingsPreset,
  SettingsEngineAPI,
} from "@lavarrock/plugin-settings-engine";

// ── IDs ──

const LAYOUT_SETTINGS_ID = "lavarrock.layout-engine";

// ── Helpers ──

function valuesToLayout(values: Record<string, any>): LayoutInputs {
  return {
    radius: values.radius ?? DEFAULT_LAYOUT.radius,
    spacing: values.spacing ?? DEFAULT_LAYOUT.spacing,
    panelGap: values.panelGap ?? DEFAULT_LAYOUT.panelGap,
    cardPadding: values.cardPadding ?? DEFAULT_LAYOUT.cardPadding,
    sidebarWidth: values.sidebarWidth ?? DEFAULT_LAYOUT.sidebarWidth,
    containerMax: values.containerMax ?? DEFAULT_LAYOUT.containerMax,
    baseFontSize: values.baseFontSize ?? DEFAULT_LAYOUT.baseFontSize,
    borderWidth: values.borderWidth ?? DEFAULT_LAYOUT.borderWidth,
  };
}

function migrateOldStorage(): LayoutInputs | null {
  try {
    const raw = localStorage.getItem("lavarrock-layout-config");
    if (raw) {
      const inputs = deserializeLayout(JSON.parse(raw));
      localStorage.removeItem("lavarrock-layout-config");
      return inputs;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ── Build shared field definitions ──

function buildFields(): SettingsFieldDef[] {
  return [
    {
      key: "radius",
      label: "Roundness",
      type: "slider",
      group: "Border Radius",
      default: DEFAULT_LAYOUT.radius,
      min: 0,
      max: 2.5,
      step: 0.05,
      unit: "×",
      formatValue: (v: number) =>
        v === 0
          ? "Sharp"
          : v <= 0.5
            ? `Subtle (${v.toFixed(2)}×)`
            : v >= 2
              ? `Round (${v.toFixed(2)}×)`
              : `${v.toFixed(2)}×`,
    },
    {
      key: "spacing",
      label: "Density",
      type: "slider",
      group: "Spacing",
      default: DEFAULT_LAYOUT.spacing,
      min: 0.5,
      max: 2,
      step: 0.05,
      unit: "×",
      formatValue: (v: number) =>
        v <= 0.7
          ? `Compact (${v.toFixed(2)}×)`
          : v >= 1.3
            ? `Spacious (${v.toFixed(2)}×)`
            : `${v.toFixed(2)}×`,
    },
    {
      key: "panelGap",
      label: "Panel Gap",
      type: "slider",
      group: "Spacing",
      default: DEFAULT_LAYOUT.panelGap,
      min: 0,
      max: 24,
      step: 1,
      unit: "px",
    },
    {
      key: "cardPadding",
      label: "Card Padding",
      type: "slider",
      group: "Spacing",
      default: DEFAULT_LAYOUT.cardPadding,
      min: 0.4,
      max: 2,
      step: 0.05,
      unit: "×",
    },
    {
      key: "sidebarWidth",
      label: "Sidebar Width",
      type: "slider",
      group: "Dimensions",
      default: DEFAULT_LAYOUT.sidebarWidth,
      min: 160,
      max: 360,
      step: 4,
      unit: "px",
    },
    {
      key: "containerMax",
      label: "Container Max",
      type: "slider",
      group: "Dimensions",
      default: DEFAULT_LAYOUT.containerMax,
      min: 0,
      max: 1920,
      step: 20,
      unit: "px",
      formatValue: (v: number) => (v === 0 ? "Full width" : `${v}px`),
    },
    {
      key: "baseFontSize",
      label: "Base Font Size",
      type: "slider",
      group: "Typography & Borders",
      default: DEFAULT_LAYOUT.baseFontSize,
      min: 11,
      max: 18,
      step: 0.5,
      unit: "px",
    },
    {
      key: "borderWidth",
      label: "Border Width",
      type: "slider",
      group: "Typography & Borders",
      default: DEFAULT_LAYOUT.borderWidth,
      min: 0,
      max: 3,
      step: 0.1,
      unit: "px",
      formatValue: (v: number) => (v === 0 ? "None" : `${v.toFixed(1)}px`),
    },
  ];
}

function buildPresets(): SettingsPreset[] {
  return LAYOUT_PRESETS.map((p) => ({
    name: p.name,
    description: p.description,
    values: { ...p.inputs },
  }));
}

// ── Apply helper ──

function applyLayout(values: Record<string, any>): void {
  applyLayoutToDOM(valuesToLayout(values));
}

// ── Registration ──

function registerWithSettingsEngine(): (() => void) | undefined {
  const api = window.__LAVARROCK_SETTINGS;
  if (!api) return;

  const migrated = migrateOldStorage();

  const unregister = api.register({
    id: LAYOUT_SETTINGS_ID,
    pluginId: "lavarrock.layout-engine",
    label: "Layout",
    icon: "LayoutGrid",
    description: "Control spacing, radius, dimensions, and typography",
    category: "appearance",
    fields: buildFields(),
    presets: buildPresets(),
    sections: [
      { label: "Border Radius", group: "Border Radius" },
      { label: "Spacing", group: "Spacing" },
      { label: "Dimensions", group: "Dimensions" },
      { label: "Typography & Borders", group: "Typography & Borders" },
    ],
    autosave: true,
    onChange: applyLayout,
    searchKeywords: [
      "spacing",
      "radius",
      "border",
      "font",
      "sidebar",
      "gap",
      "padding",
      "density",
      "layout",
    ],
  });

  // Apply migrated data if present
  if (migrated) {
    api.setValues(LAYOUT_SETTINGS_ID, { ...migrated });
  } else {
    // Apply current stored values on load
    applyLayout(api.getValues(LAYOUT_SETTINGS_ID));
  }

  return unregister;
}

// ── Init ──

export function initLayoutManager(): void {
  let unregSettings: (() => void) | undefined;

  // Settings engine
  if (window.__LAVARROCK_SETTINGS) {
    unregSettings = registerWithSettingsEngine();
  } else {
    const handler = () => {
      unregSettings = registerWithSettingsEngine();
    };
    window.addEventListener("lavarrock:settings-ready", handler, {
      once: true,
    });
  }
}

initLayoutManager();
