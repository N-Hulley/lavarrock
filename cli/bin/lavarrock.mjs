#!/usr/bin/env node

// Resolve via ts-node in dev, compiled JS in production
const isDev = process.env.LAVARROCK_CLI_DEV === "1";

if (isDev) {
  // Dev mode: use ts-node/esm loader
  const { register } = await import("node:module");
  register("ts-node/esm", import.meta.url);
  await import("../src/index.ts");
} else {
  // Production: use compiled output
  await import("../dist/index.js");
}
