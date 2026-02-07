import React from "react";
import ReactDOM from "react-dom/client";
import * as ReactDOMAll from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { store } from "./state/store";
import { I18nProvider } from "./i18n";
import "./index.css";

// ── Expose React as globals for dynamically loaded plugins ──
// Plugin IIFE bundles are built with React externalized to
// window.React / window.ReactDOM. This MUST run before any
// plugin script is injected.
//
// We merge the full react-dom (which has createPortal, flushSync, etc.)
// with react-dom/client (which has createRoot, hydrateRoot) so that
// externalized imports of either module resolve correctly.
//
// Some bundled deps (e.g. react-resizable-panels) use the automatic
// JSX runtime (react/jsx-runtime), which is also mapped to window.React.
// We attach jsx/jsxs/Fragment so those calls resolve correctly.
(window as any).React = React;
(window as any).ReactDOM = { ...ReactDOMAll, ...ReactDOM };
(window as any).React.jsx = jsxRuntime.jsx;
(window as any).React.jsxs = jsxRuntime.jsxs;
(window as any).React.Fragment = React.Fragment;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </Provider>
  </React.StrictMode>,
);
