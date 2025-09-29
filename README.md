
# Stackify Monorepo

Stackify is a toolkit for deploying and managing modern web applications (Next.js, Vite, Nuxt, Vue, React, and more) to the cloud with minimal configuration.

## Packages

- [`packages/stackify-cli`](./packages/stackify-cli): Command-line tool for deployment and service management. See its [README](./packages/stackify-cli/README.md) for usage and details.
- [`packages/stackify-core`](./packages/stackify-core): Core library for Stackify configuration and integration.
- [`packages/stackify-platform`](./packages/stackify-platform): Platform utilities and server-side integrations.

## Quick Start

1. **Install the CLI globally:**
  ```bash
  npm install -g @stacklify/cli
  ```
2. **Set up your project:**
  - (If using TypeScript) Install `@stackify/core` in your project:
    ```bash
    npm install @stackify/core
    ```
  - Create a `stackify.config.ts` file:
    ```typescript
    import { defineStackifyConfig } from "@stackify/core";
    export default defineStackifyConfig({
     name: "your-app-name",
    });
    ```
3. **Start the Stackify service on your server:**
  ```bash
  stackify start
  # Use --workdir=PATH to specify a working directory.
  # Use --proxy-port=PORT to configure the proxy port for the application.
  ```
4. **Deploy your application:**
  ```bash
  stackify deploy
  ```
5. **Stop the Stackify service:**
  ```bash
  stackify stop
  ```

## Repository Structure

- `packages/stackify-cli/` — CLI tool and deployment logic
- `packages/stackify-core/` — Core configuration and utilities
- `packages/stackify-platform/` — Platform/server-side code and Docker example
- `examples/` — Example projects and configurations

## License
ISC