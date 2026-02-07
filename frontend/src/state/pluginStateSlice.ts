import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface NamespaceState {
  [key: string]: unknown;
}

export interface PluginStateStore {
  namespaces: Record<string, NamespaceState>;
}

const initialState: PluginStateStore = {
  namespaces: {},
};

const pluginStateSlice = createSlice({
  name: "pluginState",
  initialState,
  reducers: {
    setValue(
      state,
      action: PayloadAction<{ namespace: string; key: string; value: unknown }>
    ) {
      const { namespace, key, value } = action.payload;
      if (!state.namespaces[namespace]) {
        state.namespaces[namespace] = {};
      }
      state.namespaces[namespace][key] = value;
    },
    setValues(
      state,
      action: PayloadAction<{ namespace: string; values: Record<string, unknown> }>
    ) {
      const { namespace, values } = action.payload;
      if (!state.namespaces[namespace]) {
        state.namespaces[namespace] = {};
      }
      state.namespaces[namespace] = {
        ...state.namespaces[namespace],
        ...values,
      };
    },
    replaceNamespace(
      state,
      action: PayloadAction<{ namespace: string; values: Record<string, unknown> }>
    ) {
      const { namespace, values } = action.payload;
      state.namespaces[namespace] = { ...values };
    },
    clearNamespace(state, action: PayloadAction<{ namespace: string }>) {
      const { namespace } = action.payload;
      delete state.namespaces[namespace];
    },
  },
});

export const { setValue, setValues, replaceNamespace, clearNamespace } =
  pluginStateSlice.actions;

export default pluginStateSlice.reducer;