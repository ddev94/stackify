# @stackify/cli

A command-line tool for deploying and managing web applications with Stackify.

## Features
- Start and stop the Stackify service on your server
- Deploy your application to the cloud with a single command
- Supports custom working directories
- Integrates with @stackify/core for TypeScript projects

## Prerequisites
- Node.js v20 or higher
- Docker

## Installation
```bash
npm install -g @stackify/cli
```

## Usage

### 1. Start the Stackify Service
```bash
stackify start
```
- Use `--workdir=PATH` to specify a custom working directory.

### 2. Stop the Stackify Service
```bash
stackify stop
```

### 3. Deploy Your Application
From your project directory (with a valid `stackify.config.ts`):
```bash
stackify deploy
```

## Example stackify.config.ts
```typescript
import { defineStackifyConfig } from "@stackify/core";
export default defineStackifyConfig({
  name: "your-app-name",
});
```

## Project Structure
- `src/` - CLI source code
- `bin/` - Entry point for the CLI
- `examples/` - Example projects and configurations

## License
ISC
