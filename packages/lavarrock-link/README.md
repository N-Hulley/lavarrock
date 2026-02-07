# @lavarrock/link

A bridge package that serves as the interface between Lavarrock and its extensions. This package provides type definitions, validation utilities, and data movement helpers for safe communication between the main application and extension plugins.

## Features

- **Type Definitions**: Comprehensive TypeScript types for extension interfaces, data structures, and API contracts
- **Type Validation**: Runtime validation utilities using Zod for ensuring data integrity
- **Data Bridge**: Helpers for marshaling data between the application and extension sandboxes
- **Event System**: Typed event interfaces for plugin communication

## Installation

This package is meant to be installed as a dependency in both the main application and extension packages:

```bash
npm install @lavarrock/link
```

## Usage

### Type Definitions

```typescript
import type { ExtensionManifest, PluginContext } from "@lavarrock/link";

const manifest: ExtensionManifest = {
  id: "my-extension",
  name: "My Extension",
  version: "1.0.0",
};
```

### Validation

```typescript
import { validateManifest, validateMessage } from "@lavarrock/link/validate";

const isValid = validateManifest(manifestData);
```

### Data Bridge

```typescript
import { serializeData, deserializeData } from "@lavarrock/link/bridge";

const serialized = serializeData(complexObject);
const restored = deserializeData(serialized);
```

## Package Structure

- `src/types.ts` - Core type definitions for extensions
- `src/validate.ts` - Zod validation schemas and runtime validators
- `src/bridge.ts` - Data serialization and messaging utilities
- `src/index.ts` - Public API exports
