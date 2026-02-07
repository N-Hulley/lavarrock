FROM node:20-alpine

WORKDIR /app

# Copy root workspace config
COPY package*.json ./

# Copy all workspace package.json files needed for resolution
COPY frontend/package.json ./frontend/
COPY packages/ui/package.json ./packages/ui/
COPY packages/lavarrock-link/package.json ./packages/lavarrock-link/
COPY plugins/lavarrock-wm/package.json ./plugins/lavarrock-wm/
COPY plugins/lavarrock-header/package.json ./plugins/lavarrock-header/
COPY plugins/lavarrock-footer/package.json ./plugins/lavarrock-footer/
COPY plugins/lavarrock-json-tool/package.json ./plugins/lavarrock-json-tool/
COPY plugins/lavarrock-tooltips/package.json ./plugins/lavarrock-tooltips/
COPY plugins/lavarrock-ui/package.json ./plugins/lavarrock-ui/
COPY registry/package.json ./registry/

# Install all workspace deps (resolves inter-package links)
RUN npm install --legacy-peer-deps 2>&1 | tail -5

# Copy source code needed for building plugins
COPY packages/ui/src ./packages/ui/src
COPY packages/ui/styles.css ./packages/ui/
COPY plugins/ ./plugins/
COPY registry/src ./registry/src

# Build all plugins into IIFE bundles
RUN node registry/src/build.mjs

# Expose registry port
EXPOSE 3001

CMD ["node", "registry/src/server.mjs"]
