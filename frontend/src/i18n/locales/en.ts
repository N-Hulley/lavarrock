export const en = {
  common: {
    search: "Search",
    settings: "Settings",
    open: "Open",
    close: "Close",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    loading: "Loading",
    error: "Error",
  },
  extensions: {
    title: "Extensions",
    searchPlaceholder: "Search extensions...",
    noExtensionsFound: "No extensions found",
    clearSearch: "Clear search",
    browseMarketplace: "Browse Marketplace",
    sections: {
      builtin: "Built-in",
      community: "Community",
    },
    badges: {
      builtin: "Built-in",
      installed: "Installed",
      enabled: "Enabled",
    },
    actions: {
      open: "Open",
      settings: "Settings",
      enable: "Enable",
      disable: "Disable",
      uninstall: "Uninstall",
    },
  },
  tabs: {
    collapsePanel: "Collapse panel",
    expandPanel: "Expand panel",
    closeTab: "Close tab",
    tabSettings: "Tab settings",
    noTabsOpen: "No tabs open.",
    dropHereToSplit: "Drop here to split",
  },
  errors: {
    pluginNotFound: "Plugin not found.",
    loadingExtensions: "Error loading extensions",
    notAvailable: "Not available",
  },
  status: {
    ready: "Ready",
    syncIdle: "Sync: idle",
    peersOnline: "{{count}} peers online",
  },
  app: {
    vaultPlaceholder: "Lavarrock Vault",
    extensionsTooltip: "Extensions",
    extensionsButtonTitle: "Open Extensions Browser",
  },
} as const;

export type TranslationKeys = typeof en;