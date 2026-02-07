export { initSettingsEngine, settingsRegistry } from "./lib/settings-engine";

export type {
  SettingsFieldDef,
  TextField,
  NumberField,
  SliderField,
  SelectField,
  SwitchField,
  CheckboxField,
  ColorField,
  TextareaField,
  CustomField,
  SettingsPreset,
  SettingsSection,
  SettingsSchema,
  SettingsValuesMap,
  SettingsEngineAPI,
  CustomFieldRenderer,
  CustomFieldRendererProps,
} from "./lib/settings-engine";

import { initSettingsEngine } from "./lib/settings-engine";
initSettingsEngine();
