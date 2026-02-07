import { store } from "./store";
import {
  clearNamespace,
  replaceNamespace,
  setValue,
  setValues,
} from "./pluginStateSlice";
import { pluginManager } from "@/plugins/PluginManager";

type AccessAction = "read" | "write";

function getPluginByNamespace(namespace: string) {
  const plugins = pluginManager.getAllPlugins();
  return plugins.find((plugin) => {
    const ns = plugin.state?.namespace || plugin.id;
    return ns === namespace;
  });
}

function canAccessNamespace(
  requesterId: string,
  namespace: string,
  key: string,
  action: AccessAction
): boolean {
  const owner = getPluginByNamespace(namespace);
  if (!owner) return false;

  // Owners always have full access to their own namespace
  if (owner.id === requesterId) return true;

  const stateConfig = owner.state;
  if (!stateConfig) return false;

  const exports = stateConfig.exports || [];
  const allowRead = stateConfig.allowRead || [];
  const allowWrite = stateConfig.allowWrite || [];

  // Cross-extension access only to exported keys
  if (exports.length > 0 && !exports.includes(key)) return false;

  const allowList = action === "read" ? allowRead : allowWrite;
  return allowList.includes(requesterId) || allowList.includes("*");
}

function assertAccess(
  requesterId: string,
  namespace: string,
  key: string,
  action: AccessAction
) {
  if (!canAccessNamespace(requesterId, namespace, key, action)) {
    throw new Error(
      `Access denied: ${requesterId} cannot ${action} ${namespace}.${key}`
    );
  }
}

export function resolveNamespaceForPlugin(pluginId: string): string {
  const plugin = pluginManager.getPlugin(pluginId);
  return plugin?.state?.namespace || pluginId;
}

export function getNamespaceState(requesterId: string, namespace?: string) {
  const ns = namespace || resolveNamespaceForPlugin(requesterId);
  const data = store.getState().pluginState.namespaces[ns] || {};

  // Filter by exports if requester isn't owner
  const owner = getPluginByNamespace(ns);
  if (!owner) return {};
  if (owner.id === requesterId) return data;

  const exports = owner.state?.exports || [];
  if (exports.length === 0) return {};

  return exports.reduce<Record<string, unknown>>((acc, key) => {
    if (key in data && canAccessNamespace(requesterId, ns, key, "read")) {
      acc[key] = data[key];
    }
    return acc;
  }, {});
}

export function getNamespaceValue(
  requesterId: string,
  key: string,
  namespace?: string
) {
  const ns = namespace || resolveNamespaceForPlugin(requesterId);
  assertAccess(requesterId, ns, key, "read");
  const data = store.getState().pluginState.namespaces[ns] || {};
  return data[key];
}

export function setNamespaceValue(
  requesterId: string,
  key: string,
  value: unknown,
  namespace?: string
) {
  const ns = namespace || resolveNamespaceForPlugin(requesterId);
  assertAccess(requesterId, ns, key, "write");
  store.dispatch(setValue({ namespace: ns, key, value }));
}

export function setNamespaceValues(
  requesterId: string,
  values: Record<string, unknown>,
  namespace?: string
) {
  const ns = namespace || resolveNamespaceForPlugin(requesterId);
  Object.keys(values).forEach((key) =>
    assertAccess(requesterId, ns, key, "write")
  );
  store.dispatch(setValues({ namespace: ns, values }));
}

export function replaceNamespaceValues(
  requesterId: string,
  values: Record<string, unknown>,
  namespace?: string
) {
  const ns = namespace || resolveNamespaceForPlugin(requesterId);
  Object.keys(values).forEach((key) =>
    assertAccess(requesterId, ns, key, "write")
  );
  store.dispatch(replaceNamespace({ namespace: ns, values }));
}

export function clearNamespaceValues(
  requesterId: string,
  namespace?: string
) {
  const ns = namespace || resolveNamespaceForPlugin(requesterId);
  if (requesterId !== getPluginByNamespace(ns)?.id) {
    throw new Error(`Access denied: ${requesterId} cannot clear ${ns}`);
  }
  store.dispatch(clearNamespace({ namespace: ns }));
}