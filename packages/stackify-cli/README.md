
# Stackify

[![npm version](https://img.shields.io/npm/v/stackify-cli)](https://npmjs.com/package/stackify-cli)
[![npm downloads](https://img.shields.io/npm/dm/stackify-cli)](https://npm.chart.dev/stackify-cli)

Stackify is a toolkit for deploying and managing modern web applications (Next.js, Vite, Nuxt, Vue, React, and more) to the cloud with minimal configuration.

## Packages

- [`packages/stackify-cli`](./packages/stackify-cli): Command-line tool for deployment and service management. See its [README](./packages/stackify-cli/README.md) for usage and details.
- [`packages/stackify-core`](./packages/stackify-core): Core library for Stackify configuration and integration.
- [`packages/stackify-rest`](./packages/stackify-rest): The REST API for Stackify.

## Quick Start

**Setup stackify server**

  ```bash
  npx stackify-cli server start
  ```

**Set up your project:**

(If using TypeScript) Install `stackify-core` in your project:

```bash
npm install stackify-core
```

Create a `stackify.config.ts` or `stackify.config.js` file:
  
with javascript

```javascript
export default {
  name: 'your-app-name',
  rest: {
    url: "http://my-domain/rest"
  },
  platform: "vite", // next, nuxt
}
```

with typescript

```typescript
import { defineStackifyConfig } from "stackify-core";
export default defineStackifyConfig({
  // stackify config
});
```

**Deploy your application:**

```bash
npx stackify-cli deploy
```

**Stop the Stackify server:**

```bash
npx stackify-cli server stop
```

## Repository Structure

- `packages/stackify-cli/` — CLI tool and deployment logic
- `packages/stackify-core/` — Core configuration and utilities
- `packages/stackify-rest/` — rest/server-side code and Docker example
- `examples/` — Example projects and configurations

## License
ISC