import { configureStore } from "@reduxjs/toolkit";
import pluginStateReducer from "./pluginStateSlice";

export const store = configureStore({
  reducer: {
    pluginState: pluginStateReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;