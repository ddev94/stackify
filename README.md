
# Stackify

Stackify is a library designed to streamline the deployment of modern web applications (Next.js, Vite, Nuxt, Vue, React, and more) to the cloud with minimal configuration.

## Prerequisites

- Node.js v20 or higher

## Installation

```bash
npm install -g @stacklify/cli
```

## Starting the Stackify Service on Your Server

```bash
stackify start
```

To specify a custom working directory, use the `--workdir=PATH` option.

## Stopping the Stackify Service

```bash
stackify stop
```

## Deploying Your Application from Local

If you are using TypeScript, install `@stackify/core`:

Create a `stackify.config.ts` file with the following content:

```typescript
import { defineStackifyConfig } from "@stackify/core";
export default defineStackifyConfig({
  name: "stackify-app-vite-react",
});
```

Then deploy your app:

```bash
stackify deploy
```

Your application will be deployed to the cloud in just a few minutes.