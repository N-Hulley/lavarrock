import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Input,
  Slider,
  Switch,
  Checkbox,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  SettingsForm,
  SettingsGroup,
  SettingsItem,
  SettingsItemLabel,
  SettingsItemControl,
} from "@lavarrock/ui";
import {
  Settings,
  Search,
  RotateCcw,
  Save,
  Undo2,
  ChevronDown,
  ChevronRight,
  Check,
  Palette,
  LayoutGrid,
  Puzzle,
  Sliders,
  Cog,
  X,
  Upload,
  Download,
  FileUp,
  Braces,
  Copy,
  ClipboardCheck,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import type {
  SettingsSchema,
  SettingsSection,
  SettingsFieldDef,
  SettingsValuesMap,
  SettingsPreset,
  CustomField,
  SettingsEngineAPI,
  CustomFieldRenderer,
} from "@lavarrock/plugin-settings-engine";

// ── Icon map ──

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Settings,
  Palette,
  LayoutGrid,
  Puzzle,
  Sliders,
  Cog,
  Upload,
  Save,
};

function resolveIcon(
  name?: string,
): React.ComponentType<{ className?: string }> {
  if (!name) return Settings;
  return ICON_MAP[name] ?? Settings;
}

// ── Category metadata ──

const CATEGORY_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    order: number;
  }
> = {
  general: { label: "General", icon: Settings, order: 0 },
  appearance: { label: "Appearance", icon: Palette, order: 1 },
  plugins: { label: "Plugins", icon: Puzzle, order: 2 },
  advanced: { label: "Advanced", icon: Cog, order: 3 },
};

function getCategoryMeta(cat: string) {
  return (
    CATEGORY_META[cat] ?? {
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon: Puzzle,
      order: 99,
    }
  );
}

// ── Section helpers ──

/**
 * Derive sidebar sections from a schema.
 * If the schema has explicit `sections`, use those.
 * Otherwise auto-generate flat sections from field group names.
 */
function getSchemaSections(schema: SettingsSchema): SettingsSection[] {
  if (schema.sections && schema.sections.length > 0) return schema.sections;

  // Auto-generate from field groups
  const seen = new Set<string>();
  const sections: SettingsSection[] = [];
  for (const field of schema.fields) {
    const g = field.group;
    if (g && !seen.has(g)) {
      seen.add(g);
      sections.push({ label: g, group: g });
    }
  }
  return sections;
}

/** Flatten a section tree to all group names it maps to */
function collectSectionGroups(section: SettingsSection): string[] {
  const groups: string[] = [];
  if (section.group) {
    if (Array.isArray(section.group)) groups.push(...section.group);
    else groups.push(section.group);
  }
  if (section.children) {
    for (const child of section.children) {
      groups.push(...collectSectionGroups(child));
    }
  }
  return groups;
}

/** Create a stable DOM id for a group heading inside a schema form */
function groupAnchorId(schemaId: string, group: string): string {
  return `settings-group-${schemaId}-${group.replace(/\s+/g, "-").toLowerCase()}`;
}

// ── Helpers ──

function getSettingsAPI(): SettingsEngineAPI | null {
  return window.__LAVARROCK_SETTINGS ?? null;
}

function groupFields(
  fields: SettingsFieldDef[],
): { group: string; fields: SettingsFieldDef[] }[] {
  const groups = new Map<string, SettingsFieldDef[]>();
  for (const field of fields) {
    const g = field.group ?? "";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(field);
  }
  return Array.from(groups.entries()).map(([group, fields]) => ({
    group,
    fields: fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  }));
}

// ── Built-in field renderers ──

function FieldWrapper({
  field,
  children,
}: {
  field: SettingsFieldDef;
  children: React.ReactNode;
}) {
  return (
    <SettingsItem>
      <SettingsItemLabel>
        <Label className="text-[10px] text-muted-foreground font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {field.description && (
          <p className="text-[9px] text-muted-foreground/70 leading-tight">
            {field.description}
          </p>
        )}
      </SettingsItemLabel>
      {children}
    </SettingsItem>
  );
}

function TextFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "text" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldWrapper field={field}>
      <Input
        className="h-7 text-xs"
        placeholder={field.placeholder}
        value={value ?? ""}
        disabled={field.disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrapper>
  );
}

function NumberFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "number" }>;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <FieldWrapper field={field}>
      <Input
        type="number"
        className="h-7 text-xs"
        value={value ?? 0}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        disabled={field.disabled}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </FieldWrapper>
  );
}

function SliderFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "slider" }>;
  value: number;
  onChange: (v: number) => void;
}) {
  const display = field.formatValue
    ? field.formatValue(value)
    : field.unit
      ? `${Math.round(value * 100) / 100}${field.unit}`
      : `${Math.round(value * 100) / 100}`;
  return (
    <SettingsItem>
      <div className="flex items-center justify-between">
        <SettingsItemLabel>
          <Label className="text-[10px] text-muted-foreground font-medium">
            {field.label}
          </Label>
        </SettingsItemLabel>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {display}
        </span>
      </div>
      <Slider
        value={[value ?? field.min]}
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        disabled={field.disabled}
        onValueChange={([v]) => onChange(v)}
      />
    </SettingsItem>
  );
}

function SelectFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "select" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldWrapper field={field}>
      <Select
        value={value ?? ""}
        onValueChange={onChange}
        disabled={field.disabled}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
}

function SwitchFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "switch" }>;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <SettingsItem orientation="horizontal">
      <SettingsItemLabel>
        <Label className="text-[10px] text-muted-foreground font-medium">
          {field.label}
        </Label>
        {field.description && (
          <p className="text-[9px] text-muted-foreground/70 leading-tight">
            {field.description}
          </p>
        )}
      </SettingsItemLabel>
      <SettingsItemControl>
        <Switch
          checked={value ?? false}
          onCheckedChange={onChange}
          disabled={field.disabled}
          className="scale-75 origin-right"
        />
      </SettingsItemControl>
    </SettingsItem>
  );
}

function CheckboxFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "checkbox" }>;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <SettingsItem orientation="horizontal">
      <SettingsItemLabel className="flex items-center gap-2">
        <Checkbox
          checked={value ?? false}
          onCheckedChange={(v) => onChange(v === true)}
          disabled={field.disabled}
          className="h-3.5 w-3.5"
        />
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground font-medium">
            {field.label}
          </Label>
          {field.description && (
            <p className="text-[9px] text-muted-foreground/70 leading-tight">
              {field.description}
            </p>
          )}
        </div>
      </SettingsItemLabel>
    </SettingsItem>
  );
}

function ColorFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "color" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldWrapper field={field}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled}
          className="h-7 w-10 cursor-pointer rounded-[var(--radius-sm)] border border-input bg-transparent p-0.5"
        />
        <Input
          className="h-7 text-xs flex-1 font-mono"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.disabled}
        />
      </div>
    </FieldWrapper>
  );
}

function TextareaFieldComp({
  field,
  value,
  onChange,
}: {
  field: Extract<SettingsFieldDef, { type: "textarea" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldWrapper field={field}>
      <Textarea
        className="text-xs min-h-[60px] resize-y"
        placeholder={field.placeholder}
        rows={field.rows ?? 3}
        value={value ?? ""}
        disabled={field.disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrapper>
  );
}

// ── Custom field fallback ──

function CustomFieldFallback({ field }: { field: CustomField }) {
  return (
    <FieldWrapper field={field}>
      <div className="rounded-[var(--radius)] border border-dashed border-border px-2 py-1.5 text-[10px] text-muted-foreground">
        Unknown field type: <code>{field.rendererType}</code>
      </div>
    </FieldWrapper>
  );
}

// ── Dynamic field renderer ──

function DynamicField({
  field,
  value,
  onChange,
  allValues,
  schemaId,
  searchMatch,
}: {
  field: SettingsFieldDef;
  value: any;
  onChange: (v: any) => void;
  allValues: SettingsValuesMap;
  schemaId: string;
  searchMatch?: boolean;
}) {
  let content: React.ReactNode = null;

  switch (field.type) {
    case "text":
      content = (
        <TextFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "number":
      content = (
        <NumberFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "slider":
      content = (
        <SliderFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "select":
      content = (
        <SelectFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "switch":
      content = (
        <SwitchFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "checkbox":
      content = (
        <CheckboxFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "color":
      content = (
        <ColorFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "textarea":
      content = (
        <TextareaFieldComp field={field} value={value} onChange={onChange} />
      );
      break;
    case "custom": {
      const api = getSettingsAPI();
      const Renderer = api?.getFieldRenderer(field.rendererType);
      if (Renderer) {
        content = (
          <FieldWrapper field={field}>
            <Renderer
              field={field}
              value={value}
              onChange={onChange}
              allValues={allValues}
              schemaId={schemaId}
            />
          </FieldWrapper>
        );
      } else {
        content = <CustomFieldFallback field={field} />;
      }
      break;
    }
    default:
      return null;
  }

  if (searchMatch) {
    return (
      <div className="rounded-[var(--radius)] ring-1 ring-primary/50 bg-primary/5 px-1.5 py-1 -mx-1.5 transition-all duration-300">
        {content}
      </div>
    );
  }

  return content;
}

// ── Schema form ──

function SchemaForm({
  schema,
  searchQuery,
  highlightedGroup,
}: {
  schema: SettingsSchema;
  searchQuery?: string;
  highlightedGroup?: string | null;
}) {
  const api = getSettingsAPI()!;
  const isAutosave = schema.autosave !== false;
  const q = (searchQuery ?? "").toLowerCase().trim();

  const [draft, setDraft] = useState<SettingsValuesMap>(() =>
    api.getValues(schema.id),
  );
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const unsub = api.subscribeValues((sid, values) => {
      if (sid === schema.id) {
        setDraft(values);
        setIsDirty(false);
      }
    });
    setDraft(api.getValues(schema.id));
    return unsub;
  }, [schema.id]);

  const handleChange = useCallback(
    (key: string, value: any) => {
      if (isAutosave) {
        api.setValue(schema.id, key, value);
      } else {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
      }
    },
    [schema.id, isAutosave],
  );

  const handleSave = useCallback(() => {
    api.setValues(schema.id, draft);
    setIsDirty(false);
  }, [schema.id, draft]);

  const handleDiscard = useCallback(() => {
    setDraft(api.getValues(schema.id));
    setIsDirty(false);
  }, [schema.id]);

  const handleReset = useCallback(() => {
    api.resetValues(schema.id);
  }, [schema.id]);

  const groups = groupFields(schema.fields);
  const presets = schema.presets ?? [];

  // Active preset detection
  const activePreset = presets.find((p) => {
    const keys = Object.keys(p.values);
    return keys.every((k) => {
      const dv = draft[k];
      const pv = p.values[k];
      if (typeof dv === "number" && typeof pv === "number") {
        return Math.abs(dv - pv) < 0.001;
      }
      return dv === pv;
    });
  });

  const handleApplyPreset = useCallback(
    (preset: SettingsPreset) => {
      if (isAutosave) {
        api.applyPreset(schema.id, preset.values);
      } else {
        setDraft((prev) => ({ ...prev, ...preset.values }));
        setIsDirty(true);
      }
    },
    [schema.id, isAutosave],
  );

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleGroup = useCallback((g: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }, []);

  // Search-driven group visibility: auto-collapse groups with no matching fields
  const matchingGroups = useMemo(() => {
    if (!q) return null; // null = no filtering
    const matched = new Set<string>();
    for (const field of schema.fields) {
      if (
        field.label.toLowerCase().includes(q) ||
        field.description?.toLowerCase().includes(q)
      ) {
        matched.add(field.group ?? "");
      }
    }
    return matched;
  }, [q, schema.fields]);

  // Which fields match the search
  const matchingFields = useMemo(() => {
    if (!q) return null;
    const matched = new Set<string>();
    for (const field of schema.fields) {
      if (
        field.label.toLowerCase().includes(q) ||
        field.description?.toLowerCase().includes(q)
      ) {
        matched.add(field.key);
      }
    }
    return matched;
  }, [q, schema.fields]);

  return (
    <SettingsForm>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          {schema.description && (
            <p className="text-[9px] text-muted-foreground/70 leading-tight">
              {schema.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAutosave && (
            <span className="text-[9px] text-muted-foreground/60 italic mr-1">
              auto
            </span>
          )}
          <button
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleReset}
            title="Reset to defaults"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Presets */}
      {presets.length > 0 && (
        <>
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Presets
            </span>
            <div className="grid grid-cols-1 @min-[200px]:grid-cols-2 @min-[320px]:grid-cols-3 gap-1.5">
              {presets.map((preset) => {
                const isActive = activePreset?.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    className={`rounded-[var(--radius)] px-2 py-1.5 text-[10px] font-medium transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => handleApplyPreset(preset)}
                    title={preset.description}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isActive && <Check className="h-2.5 w-2.5" />}
                      {preset.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-px bg-border" />
        </>
      )}

      {/* Fields — grouped */}
      {groups.map(({ group, fields }, gi) => {
        // When searching, skip groups that have no matching fields
        if (matchingGroups && !matchingGroups.has(group)) return null;

        const isGroupHighlighted = highlightedGroup === group;
        // During search, auto-expand groups with matches; otherwise use manual collapse
        const isCollapsed = matchingGroups ? false : collapsed.has(group);

        return (
          <SettingsGroup key={group || `_default_${gi}`}>
            {group && (
              <>
                {gi > 0 && <div className="h-px bg-border" />}
                <button
                  id={groupAnchorId(schema.id, group)}
                  className={`flex items-center gap-1 w-full text-left scroll-mt-2 rounded px-1 -mx-1 transition-all duration-700 ${
                    isGroupHighlighted
                      ? "ring-1 ring-primary/60 bg-primary/10"
                      : ""
                  }`}
                  onClick={() => toggleGroup(group)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {group}
                  </span>
                </button>
              </>
            )}
            {!isCollapsed &&
              fields.map((field) => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={(v) => handleChange(field.key, v)}
                  allValues={draft}
                  schemaId={schema.id}
                  searchMatch={matchingFields?.has(field.key)}
                />
              ))}
          </SettingsGroup>
        );
      })}

      {/* Manual save controls */}
      {!isAutosave && (
        <>
          <div className="h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <button
              className={`flex-1 flex items-center justify-center gap-1 rounded-[var(--radius)] px-2 py-1.5 text-[10px] font-medium transition-all border ${
                isDirty
                  ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                  : "bg-muted/50 text-muted-foreground border-transparent cursor-not-allowed opacity-50"
              }`}
              onClick={handleSave}
              disabled={!isDirty}
            >
              <Save className="h-3 w-3" />
              Save
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-1 rounded-[var(--radius)] px-2 py-1.5 text-[10px] font-medium transition-all border ${
                isDirty
                  ? "bg-muted/50 text-foreground border-transparent hover:bg-muted"
                  : "bg-muted/50 text-muted-foreground border-transparent cursor-not-allowed opacity-50"
              }`}
              onClick={handleDiscard}
              disabled={!isDirty}
            >
              <Undo2 className="h-3 w-3" />
              Discard
            </button>
          </div>
        </>
      )}
    </SettingsForm>
  );
}

// ── JSON settings editor ──

const JSON_VIEW_ID = "__json__";

function JsonSettingsEditor() {
  const api = getSettingsAPI()!;
  const schemas = api.getSchemas();

  // Build a snapshot of all settings
  const buildSnapshot = useCallback(() => {
    const snapshot: Record<string, any> = {};
    for (const schema of api.getSchemas()) {
      snapshot[schema.id] = {
        label: schema.label,
        values: api.getValues(schema.id),
      };
    }
    return snapshot;
  }, []);

  const [json, setJson] = useState(() =>
    JSON.stringify(buildSnapshot(), null, 2),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Re-sync when schemas/values change
  useEffect(() => {
    const unsub = api.subscribeValues(() => {
      setJson(JSON.stringify(buildSnapshot(), null, 2));
      setParseError(null);
    });
    const unsubSchema = api.subscribeSchemas(() => {
      setJson(JSON.stringify(buildSnapshot(), null, 2));
      setParseError(null);
    });
    return () => {
      unsub();
      unsubSchema();
    };
  }, [buildSnapshot]);

  // Validate JSON as user types
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setJson(val);
      setApplied(false);
      try {
        JSON.parse(val);
        setParseError(null);
      } catch (err: unknown) {
        setParseError(err instanceof Error ? err.message : "Invalid JSON");
      }
    },
    [],
  );

  // Apply edited JSON to settings engine
  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(json) as Record<
        string,
        { label?: string; values?: Record<string, any> }
      >;
      for (const [schemaId, entry] of Object.entries(parsed)) {
        if (entry?.values && api.getSchema(schemaId)) {
          api.setValues(schemaId, entry.values);
        }
      }
      setApplied(true);
      setParseError(null);
      setTimeout(() => setApplied(false), 2000);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Failed to apply");
    }
  }, [json]);

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [json]);

  // Export as file download
  const handleExport = useCallback(() => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lavarrock-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [json]);

  // Import from file
  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as Record<
          string,
          { label?: string; values?: Record<string, any> }
        >;

        let applied = 0;
        for (const [schemaId, entry] of Object.entries(parsed)) {
          if (entry?.values && api.getSchema(schemaId)) {
            api.setValues(schemaId, entry.values);
            applied++;
          }
        }

        setJson(JSON.stringify(buildSnapshot(), null, 2));
        setParseError(null);
        setImportStatus("success");
        setImportMsg(
          `Imported ${applied} schema${applied !== 1 ? "s" : ""} from ${file.name}`,
        );
        setTimeout(() => setImportStatus("idle"), 3000);
      } catch (err: unknown) {
        setImportStatus("error");
        setImportMsg(
          err instanceof Error ? err.message : "Failed to parse file",
        );
        setTimeout(() => setImportStatus("idle"), 4000);
      }
      if (fileRef.current) fileRef.current.value = "";
    },
    [buildSnapshot],
  );

  const isValid = parseError === null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 p-2 border-b border-border shrink-0 flex-wrap">
        <button
          className="flex items-center gap-1 rounded-[var(--radius)] px-2 py-1 text-[10px] font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? (
            <ClipboardCheck className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          className="flex items-center gap-1 rounded-[var(--radius)] px-2 py-1 text-[10px] font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={handleExport}
          title="Export settings as JSON file"
        >
          <Download className="h-3 w-3" />
          Export
        </button>
        <button
          className="flex items-center gap-1 rounded-[var(--radius)] px-2 py-1 text-[10px] font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => fileRef.current?.click()}
          title="Import settings from JSON file"
        >
          <FileUp className="h-3 w-3" />
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
        <div className="flex-1" />
        <button
          className={`flex items-center gap-1 rounded-[var(--radius)] px-2 py-1 text-[10px] font-medium transition-all border ${
            isValid && !applied
              ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
              : applied
                ? "bg-green-600 text-white border-green-600"
                : "bg-muted/50 text-muted-foreground border-transparent cursor-not-allowed opacity-50"
          }`}
          onClick={handleApply}
          disabled={!isValid}
          title="Apply edited JSON to all settings"
        >
          {applied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          {applied ? "Applied" : "Apply"}
        </button>
      </div>

      {/* Status messages */}
      {importStatus === "success" && (
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-green-500 bg-green-500/10 border-b border-green-500/20">
          <Check className="h-3 w-3" />
          <span>{importMsg}</span>
        </div>
      )}
      {importStatus === "error" && (
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-destructive bg-destructive/10 border-b border-destructive/20">
          <AlertCircle className="h-3 w-3" />
          <span>{importMsg}</span>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          className="w-full h-full p-3 bg-background text-foreground font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
          value={json}
          onChange={handleChange}
          spellCheck={false}
        />
      </div>

      {/* Parse error bar */}
      {parseError && (
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-destructive bg-destructive/10 border-t border-destructive/20 shrink-0">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">{parseError}</span>
        </div>
      )}
    </div>
  );
}

// ── Sidebar section tree ──

function SectionNode({
  section,
  schemaId,
  depth,
  activeGroup,
  onGroupClick,
  expanded,
  onToggle,
}: {
  section: SettingsSection;
  schemaId: string;
  depth: number;
  activeGroup: string | null;
  onGroupClick: (group: string) => void;
  expanded: Set<string>;
  onToggle: (label: string) => void;
}) {
  const hasChildren = section.children && section.children.length > 0;
  const groups = section.group
    ? Array.isArray(section.group)
      ? section.group
      : [section.group]
    : [];
  const isActive = groups.some((g: string) => g === activeGroup);
  const nodeKey = `${schemaId}:${section.label}`;
  const isExpanded = expanded.has(nodeKey);
  const SectionIcon = section.icon ? resolveIcon(section.icon) : null;
  const pl = 12 + depth * 12;

  return (
    <>
      <button
        className={`w-full flex items-center gap-1.5 py-1 text-left transition-colors ${
          isActive
            ? "text-accent-foreground bg-accent/50"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        }`}
        style={{ paddingLeft: pl, paddingRight: 8 }}
        onClick={() => {
          if (groups.length > 0) {
            onGroupClick(groups[0]);
          }
          if (hasChildren) {
            onToggle(nodeKey);
          }
        }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground/60" />
          ) : (
            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground/60" />
          )
        ) : (
          <span className="w-2.5 shrink-0" />
        )}
        {SectionIcon && <SectionIcon className="h-3 w-3 shrink-0 opacity-60" />}
        <span className="text-[10px] truncate">{section.label}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {section.children!.map((child: SettingsSection) => (
            <SectionNode
              key={child.label}
              section={child}
              schemaId={schemaId}
              depth={depth + 1}
              activeGroup={activeGroup}
              onGroupClick={onGroupClick}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ── Main pane ──

export default function SettingsManagerPane() {
  const [schemas, setSchemas] = useState<SettingsSchema[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ready, setReady] = useState(!!window.__LAVARROCK_SETTINGS);
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Flash-highlight state
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resizable sidebar – read initial width from layout engine CSS variable
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--sidebar-width")
      .trim();
    const n = parseInt(v, 10);
    return n > 0 ? Math.min(Math.max(n, 120), 400) : 192;
  });
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(sidebarWidth);

  // React to --sidebar-width CSS variable changes from the layout engine
  useEffect(() => {
    const obs = new MutationObserver(() => {
      if (isDragging.current) return; // don't fight with manual resize
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-width")
        .trim();
      const n = parseInt(v, 10);
      if (n > 0) setSidebarWidth(Math.min(Math.max(n, 120), 400));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => obs.disconnect();
  }, []);

  // Wait for the settings engine to be ready
  useEffect(() => {
    if (window.__LAVARROCK_SETTINGS) {
      setReady(true);
      return;
    }
    const handler = () => setReady(true);
    window.addEventListener("lavarrock:settings-ready", handler);
    return () =>
      window.removeEventListener("lavarrock:settings-ready", handler);
  }, []);

  // Subscribe to schema & renderer changes
  useEffect(() => {
    if (!ready) return;
    const api = getSettingsAPI();
    if (!api) return;

    const sync = () => {
      const all = api.getSchemas();
      setSchemas(all);
      setActiveId((prev) => {
        if (prev && all.find((s) => s.id === prev)) return prev;
        return all[0]?.id ?? null;
      });
    };

    sync();
    const unsubSchemas = api.subscribeSchemas(sync);
    const unsubRenderers = api.subscribeRenderers(sync);
    return () => {
      unsubSchemas();
      unsubRenderers();
    };
  }, [ready]);

  // Build category groups with search filtering
  const { categoryGroups, flatFiltered } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    // Filter schemas by search
    const filtered = q
      ? schemas.filter((s) => {
          if (s.label.toLowerCase().includes(q)) return true;
          if (s.description?.toLowerCase().includes(q)) return true;
          if (s.searchKeywords?.some((kw) => kw.toLowerCase().includes(q)))
            return true;
          if (s.fields.some((f) => f.label.toLowerCase().includes(q)))
            return true;
          // Also match against section labels
          const secs = getSchemaSections(s);
          const matchSection = (sec: SettingsSection): boolean => {
            if (sec.label.toLowerCase().includes(q)) return true;
            return sec.children?.some(matchSection) ?? false;
          };
          if (secs.some(matchSection)) return true;
          return false;
        })
      : schemas;

    // Group by category
    const byCategory: Record<string, SettingsSchema[]> = {};
    for (const s of filtered) {
      const cat = s.category ?? "plugins";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(s);
    }

    // Sort categories by order
    const sorted = Object.entries(byCategory)
      .map(([cat, schemas]) => ({
        category: cat,
        meta: getCategoryMeta(cat),
        schemas,
      }))
      .sort((a, b) => a.meta.order - b.meta.order);

    return { categoryGroups: sorted, flatFiltered: filtered };
  }, [schemas, searchQuery]);

  // Toggle schema expand/collapse in sidebar
  const toggleSchemaExpand = useCallback((schemaId: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(schemaId)) next.delete(schemaId);
      else next.add(schemaId);
      return next;
    });
  }, []);

  // Toggle nested section expand/collapse
  const toggleSectionExpand = useCallback((nodeKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(nodeKey)) next.delete(nodeKey);
      else next.add(nodeKey);
      return next;
    });
  }, []);

  // Handle clicking a schema in the sidebar
  const handleSchemaClick = useCallback(
    (schemaId: string) => {
      if (activeId === schemaId) {
        // Toggle expand if already active
        toggleSchemaExpand(schemaId);
      } else {
        // Switch to this schema and expand it
        setActiveId(schemaId);
        setActiveGroup(null);
        setExpandedSchemas((prev) => new Set(prev).add(schemaId));
        // Scroll to top of content
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [activeId, toggleSchemaExpand],
  );

  // Handle clicking a section group in the sidebar
  const handleGroupClick = useCallback(
    (schemaId: string, group: string) => {
      // Ensure this schema is active
      if (activeId !== schemaId) {
        setActiveId(schemaId);
        setExpandedSchemas((prev) => new Set(prev).add(schemaId));
      }
      setActiveGroup(group);

      // Flash-highlight the target group
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      setHighlightedGroup(group);
      highlightTimer.current = setTimeout(
        () => setHighlightedGroup(null),
        1200,
      );

      // Scroll the content area to this group
      requestAnimationFrame(() => {
        const anchor = document.getElementById(groupAnchorId(schemaId, group));
        if (anchor) {
          anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    },
    [activeId],
  );

  // Sidebar resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWidth.current = sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = ev.clientX - dragStartX.current;
        const newWidth = Math.max(
          120,
          Math.min(400, dragStartWidth.current + delta),
        );
        setSidebarWidth(newWidth);
      };

      const handleUp = () => {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [sidebarWidth],
  );

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
        Waiting for Settings Engine…
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
        <Settings className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-[10px] text-muted-foreground">
          No settings registered yet.
        </p>
        <p className="text-[9px] text-muted-foreground/60 max-w-[200px]">
          Plugins can register settings schemas via the Settings Engine API.
        </p>
      </div>
    );
  }

  const activeSchema =
    flatFiltered.find((s) => s.id === activeId) ?? flatFiltered[0];

  return (
    <div className="@container/pane flex h-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div
        className="shrink-0 flex flex-col overflow-hidden relative"
        style={{ width: sidebarWidth }}
      >
        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-10 hover:bg-primary/30 active:bg-primary/40 transition-colors group"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          </div>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden border-r border-border">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                ref={searchRef}
                className="h-7 text-xs pl-7 pr-7"
                placeholder="Search settings…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Schema list by category */}
          <div className="flex-1 overflow-y-auto py-1">
            {categoryGroups.map(({ category, meta, schemas: catSchemas }) => (
              <div key={category} className="mb-1">
                {/* Category header */}
                <div className="flex items-center gap-1.5 px-3 py-1">
                  <meta.icon className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    {meta.label}
                  </span>
                </div>

                {/* Schema items with expandable sections */}
                {catSchemas.map((s) => {
                  const isActive = s.id === activeSchema?.id;
                  const Icon = resolveIcon(s.icon);
                  const sections = getSchemaSections(s);
                  const hasSections = sections.length > 0;
                  const isExpanded =
                    expandedSchemas.has(s.id) || (isActive && hasSections);

                  return (
                    <div key={s.id}>
                      {/* Schema row */}
                      <button
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                        onClick={() => handleSchemaClick(s.id)}
                        title={s.description ?? s.label}
                      >
                        {hasSections ? (
                          isExpanded ? (
                            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          ) : (
                            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          )
                        ) : (
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 ${hasSections ? "" : "hidden"}`}
                        />
                        <span className="text-[11px] truncate">{s.label}</span>
                      </button>

                      {/* Expanded sections */}
                      {isExpanded && hasSections && (
                        <div className="border-l border-border/40 ml-4">
                          {sections.map((sec) => (
                            <SectionNode
                              key={sec.label}
                              section={sec}
                              schemaId={s.id}
                              depth={0}
                              activeGroup={isActive ? activeGroup : null}
                              onGroupClick={(g) => handleGroupClick(s.id, g)}
                              expanded={expandedSections}
                              onToggle={toggleSectionExpand}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* JSON view item */}
            {!searchQuery && (
              <div className="mt-1 border-t border-border/40 pt-1">
                <button
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                    activeId === JSON_VIEW_ID
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  onClick={() => {
                    setActiveId(JSON_VIEW_ID);
                    setActiveGroup(null);
                  }}
                  title="View and edit all settings as JSON"
                >
                  <Braces className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] truncate">JSON</span>
                </button>
              </div>
            )}

            {flatFiltered.length === 0 && searchQuery && (
              <div className="px-3 py-4 text-center">
                <p className="text-[10px] text-muted-foreground">
                  No settings match "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        ref={contentRef}
        className="@container flex-1 overflow-hidden flex flex-col"
      >
        {activeId === JSON_VIEW_ID ? (
          <JsonSettingsEditor />
        ) : activeSchema ? (
          <div className="p-3 overflow-y-auto flex-1">
            {/* Schema title */}
            <div className="flex items-center gap-2 mb-3">
              {(() => {
                const Icon = resolveIcon(activeSchema.icon);
                return <Icon className="h-4 w-4 text-muted-foreground" />;
              })()}
              <span className="text-sm font-medium text-foreground">
                {activeSchema.label}
              </span>
            </div>

            {/* Form */}
            <SchemaForm
              key={activeSchema.id}
              schema={activeSchema}
              searchQuery={searchQuery}
              highlightedGroup={highlightedGroup}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
            Select a settings group
          </div>
        )}
      </div>
    </div>
  );
}
