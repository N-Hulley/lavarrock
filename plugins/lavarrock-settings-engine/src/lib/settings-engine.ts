/**
 * Lavarrock Settings Engine
 *
 * Extensible, schema-driven settings system for all plugins.
 *
 * Key concepts:
 *
 * 1. **SettingsSchema** — A plugin registers a schema that describes
 *    its configurable settings: field definitions, presets, groups,
 *    and an onChange callback.
 *
 * 2. **Extensible field types** — Beyond the built-in field types
 *    (text, number, slider, select, switch, checkbox, color, textarea),
 *    plugins can register **custom field renderers** (e.g. a "color-wheel"
 *    type for the theme engine). The settings manager auto-discovers
 *    and renders these.
 *
 * 3. **Persistence** — Values are stored in localStorage, keyed by
 *    schema ID. Subscribers are notified in real time.
 *
 * Usage:
 *
 *   const api = window.__LAVARROCK_SETTINGS;
 *
 *   // Register settings for your plugin
 *   const unregister = api.register({
 *     id: "lavarrock.my-plugin",
 *     pluginId: "lavarrock.my-plugin",
 *     label: "My Plugin",
 *     icon: "Settings",
 *     fields: [
 *       { key: "name", label: "Name", type: "text", default: "" },
 *       { key: "count", label: "Count", type: "slider", default: 5, min: 1, max: 100 },
 *     ],
 *   });
 *
 *   // Register a custom field type renderer
 *   api.registerFieldRenderer("color-wheel", MyColorWheelComponent);
 */

// ── Built-in field types ──

interface FieldBase {
  /** Unique key within the schema */
  key: string;
  /** Human-readable label */
  label: string;
  /** Optional description / help text */
  description?: string;
  /** If true, this field is required (text/textarea validation) */
  required?: boolean;
  /** If true, field is read-only */
  disabled?: boolean;
  /** Group name for visual sectioning */
  group?: string;
  /** Display order within group (lower = earlier) */
  order?: number;
}

export interface TextField extends FieldBase {
  type: "text";
  default: string;
  placeholder?: string;
  pattern?: string;
}

export interface NumberField extends FieldBase {
  type: "number";
  default: number;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
}

export interface SliderField extends FieldBase {
  type: "slider";
  default: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
}

export interface SelectField extends FieldBase {
  type: "select";
  default: string;
  options: Array<{ value: string; label: string }>;
}

export interface SwitchField extends FieldBase {
  type: "switch";
  default: boolean;
}

export interface CheckboxField extends FieldBase {
  type: "checkbox";
  default: boolean;
}

export interface ColorField extends FieldBase {
  type: "color";
  default: string;
  alpha?: boolean;
}

export interface TextareaField extends FieldBase {
  type: "textarea";
  default: string;
  placeholder?: string;
  rows?: number;
}

/**
 * Custom field — extensible type.
 * Any plugin can register a field renderer for this type.
 * The `config` object is passed through to the renderer.
 */
export interface CustomField extends FieldBase {
  type: "custom";
  /** The registered custom renderer type, e.g. "color-wheel" */
  rendererType: string;
  default: any;
  /** Arbitrary config passed to the custom renderer */
  config?: Record<string, any>;
}

export type SettingsFieldDef =
  | TextField
  | NumberField
  | SliderField
  | SelectField
  | SwitchField
  | CheckboxField
  | ColorField
  | TextareaField
  | CustomField;

// ── Presets ──

export interface SettingsPreset {
  name: string;
  description?: string;
  values: Record<string, any>;
}

// ── Sidebar sections ──

/**
 * Hierarchical sidebar sections for a schema.
 *
 * Each section can optionally map to one or more field `group` names
 * and can have arbitrarily nested children.
 *
 * Example:
 *   sections: [
 *     { label: "Colours", group: "Colours" },
 *     { label: "Effects", group: "Effects" },
 *     { label: "Advanced", children: [
 *       { label: "Variables", group: "Variables" },
 *       { label: "Import", group: "Import" },
 *     ]},
 *   ]
 *
 * If `sections` is omitted, the settings manager auto-generates
 * flat sections from the field `group` values.
 */
export interface SettingsSection {
  /** Display label in the sidebar */
  label: string;
  /** Optional icon name (Lucide) */
  icon?: string;
  /** Field group name(s) this section maps to */
  group?: string | string[];
  /** Nested child sections */
  children?: SettingsSection[];
}

// ── Schema ──

export interface SettingsSchema {
  /** Unique schema ID, typically matches the plugin ID */
  id: string;
  /** The plugin this settings schema belongs to */
  pluginId: string;
  /** Display label */
  label: string;
  /** Optional Lucide icon name */
  icon?: string;
  /** Optional description */
  description?: string;
  /** Optional category for grouping in the settings UI sidebar */
  category?: "general" | "appearance" | "plugins" | "advanced" | string;
  /** Field definitions */
  fields: SettingsFieldDef[];
  /**
   * Hierarchical sidebar sections.
   * If provided, the settings manager sidebar will show expandable
   * sub-items under this schema. Each section maps to field groups.
   * If omitted, sections are auto-generated from field `group` values.
   */
  sections?: SettingsSection[];
  /** Named presets */
  presets?: SettingsPreset[];
  /** If true (default), changes are saved immediately */
  autosave?: boolean;
  /** Called when values change */
  onChange?: (values: Record<string, any>) => void;
  /** Optional search keywords for the settings manager */
  searchKeywords?: string[];
}

// ── Custom field renderer ──

/**
 * Props passed to a custom field renderer component.
 * The renderer is a React component that receives these props.
 */
export interface CustomFieldRendererProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  allValues: Record<string, any>;
  schemaId: string;
}

/**
 * A React component type that can render a custom field.
 */
export type CustomFieldRenderer = React.ComponentType<CustomFieldRendererProps>;

// ── Registry ──

export type SettingsValuesMap = Record<string, any>;
export type SettingsValueSubscriber = (
  schemaId: string,
  values: SettingsValuesMap,
) => void;
export type SettingsSchemaSubscriber = () => void;
export type FieldRendererSubscriber = () => void;

const STORAGE_PREFIX = "lavarrock-settings:";

function loadValues(schemaId: string): SettingsValuesMap | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${schemaId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

function saveValues(schemaId: string, values: SettingsValuesMap): void {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${schemaId}`,
      JSON.stringify(values),
    );
  } catch {
    /* ignore */
  }
}

class SettingsRegistryImpl {
  private schemas = new Map<string, SettingsSchema>();
  private values = new Map<string, SettingsValuesMap>();
  private valueSubscribers = new Set<SettingsValueSubscriber>();
  private schemaSubscribers = new Set<SettingsSchemaSubscriber>();
  private fieldRenderers = new Map<string, CustomFieldRenderer>();
  private rendererSubscribers = new Set<FieldRendererSubscriber>();

  // ── Schema registration ──

  register(schema: SettingsSchema): () => void {
    this.schemas.set(schema.id, schema);

    const defaults: SettingsValuesMap = {};
    for (const field of schema.fields) {
      defaults[field.key] = field.default;
    }

    const stored = loadValues(schema.id);
    const merged = stored ? { ...defaults, ...stored } : defaults;
    this.values.set(schema.id, merged);

    schema.onChange?.(merged);
    this.notifySchemaChange();

    return () => {
      this.schemas.delete(schema.id);
      this.values.delete(schema.id);
      this.notifySchemaChange();
    };
  }

  // ── Schema queries ──

  getSchemas(): SettingsSchema[] {
    return Array.from(this.schemas.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }

  getSchema(id: string): SettingsSchema | undefined {
    return this.schemas.get(id);
  }

  /** Get schemas grouped by category */
  getSchemasByCategory(): Record<string, SettingsSchema[]> {
    const groups: Record<string, SettingsSchema[]> = {};
    for (const schema of this.schemas.values()) {
      const cat = schema.category ?? "plugins";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(schema);
    }
    // Sort schemas within each category
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.label.localeCompare(b.label));
    }
    return groups;
  }

  // ── Values ──

  getValues(schemaId: string): SettingsValuesMap {
    return this.values.get(schemaId) ?? {};
  }

  setValue(schemaId: string, key: string, value: any): void {
    const current = this.values.get(schemaId) ?? {};
    const updated = { ...current, [key]: value };
    this.values.set(schemaId, updated);

    const schema = this.schemas.get(schemaId);
    if (schema?.autosave !== false) {
      saveValues(schemaId, updated);
      schema?.onChange?.(updated);
    }

    this.notifyValueChange(schemaId, updated);
  }

  setValues(schemaId: string, values: SettingsValuesMap): void {
    this.values.set(schemaId, values);
    const schema = this.schemas.get(schemaId);
    saveValues(schemaId, values);
    schema?.onChange?.(values);
    this.notifyValueChange(schemaId, values);
  }

  resetValues(schemaId: string): void {
    const schema = this.schemas.get(schemaId);
    if (!schema) return;

    const defaults: SettingsValuesMap = {};
    for (const field of schema.fields) {
      defaults[field.key] = field.default;
    }

    this.values.set(schemaId, defaults);
    saveValues(schemaId, defaults);
    schema.onChange?.(defaults);
    this.notifyValueChange(schemaId, defaults);
  }

  applyPreset(schemaId: string, presetValues: Record<string, any>): void {
    const schema = this.schemas.get(schemaId);
    if (!schema) return;

    const current = this.values.get(schemaId) ?? {};
    const merged = { ...current, ...presetValues };

    this.values.set(schemaId, merged);
    saveValues(schemaId, merged);
    schema.onChange?.(merged);
    this.notifyValueChange(schemaId, merged);
  }

  // ── Custom field renderers ──

  registerFieldRenderer(
    type: string,
    renderer: CustomFieldRenderer,
  ): () => void {
    this.fieldRenderers.set(type, renderer);
    this.notifyRendererChange();
    return () => {
      this.fieldRenderers.delete(type);
      this.notifyRendererChange();
    };
  }

  getFieldRenderer(type: string): CustomFieldRenderer | undefined {
    return this.fieldRenderers.get(type);
  }

  getRegisteredFieldTypes(): string[] {
    return Array.from(this.fieldRenderers.keys());
  }

  // ── Subscriptions ──

  subscribeValues(fn: SettingsValueSubscriber): () => void {
    this.valueSubscribers.add(fn);
    return () => this.valueSubscribers.delete(fn);
  }

  subscribeSchemas(fn: SettingsSchemaSubscriber): () => void {
    this.schemaSubscribers.add(fn);
    return () => this.schemaSubscribers.delete(fn);
  }

  subscribeRenderers(fn: FieldRendererSubscriber): () => void {
    this.rendererSubscribers.add(fn);
    return () => this.rendererSubscribers.delete(fn);
  }

  // ── Notifications ──

  private notifyValueChange(schemaId: string, values: SettingsValuesMap): void {
    for (const fn of this.valueSubscribers) {
      try {
        fn(schemaId, values);
      } catch {
        /* ignore */
      }
    }
  }

  private notifySchemaChange(): void {
    for (const fn of this.schemaSubscribers) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  }

  private notifyRendererChange(): void {
    for (const fn of this.rendererSubscribers) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  }
}

// ── Singleton ──

export const settingsRegistry = new SettingsRegistryImpl();

// ── Global API ──

export interface SettingsEngineAPI {
  register: (schema: SettingsSchema) => () => void;
  getSchemas: () => SettingsSchema[];
  getSchema: (id: string) => SettingsSchema | undefined;
  getSchemasByCategory: () => Record<string, SettingsSchema[]>;
  getValues: (schemaId: string) => SettingsValuesMap;
  setValue: (schemaId: string, key: string, value: any) => void;
  setValues: (schemaId: string, values: SettingsValuesMap) => void;
  resetValues: (schemaId: string) => void;
  applyPreset: (schemaId: string, presetValues: Record<string, any>) => void;
  registerFieldRenderer: (
    type: string,
    renderer: CustomFieldRenderer,
  ) => () => void;
  getFieldRenderer: (type: string) => CustomFieldRenderer | undefined;
  getRegisteredFieldTypes: () => string[];
  subscribeValues: (fn: SettingsValueSubscriber) => () => void;
  subscribeSchemas: (fn: SettingsSchemaSubscriber) => () => void;
  subscribeRenderers: (fn: FieldRendererSubscriber) => () => void;
}

declare global {
  interface Window {
    __LAVARROCK_SETTINGS?: SettingsEngineAPI;
  }
}

export function initSettingsEngine(): void {
  const api: SettingsEngineAPI = {
    register: (s) => settingsRegistry.register(s),
    getSchemas: () => settingsRegistry.getSchemas(),
    getSchema: (id) => settingsRegistry.getSchema(id),
    getSchemasByCategory: () => settingsRegistry.getSchemasByCategory(),
    getValues: (id) => settingsRegistry.getValues(id),
    setValue: (sid, k, v) => settingsRegistry.setValue(sid, k, v),
    setValues: (sid, v) => settingsRegistry.setValues(sid, v),
    resetValues: (id) => settingsRegistry.resetValues(id),
    applyPreset: (sid, v) => settingsRegistry.applyPreset(sid, v),
    registerFieldRenderer: (t, r) =>
      settingsRegistry.registerFieldRenderer(t, r),
    getFieldRenderer: (t) => settingsRegistry.getFieldRenderer(t),
    getRegisteredFieldTypes: () => settingsRegistry.getRegisteredFieldTypes(),
    subscribeValues: (fn) => settingsRegistry.subscribeValues(fn),
    subscribeSchemas: (fn) => settingsRegistry.subscribeSchemas(fn),
    subscribeRenderers: (fn) => settingsRegistry.subscribeRenderers(fn),
  };

  window.__LAVARROCK_SETTINGS = api;
  window.dispatchEvent(new CustomEvent("lavarrock:settings-ready"));
}
