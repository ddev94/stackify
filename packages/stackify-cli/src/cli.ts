import { runMain as _runMain, defineCommand } from "citty";

const main = defineCommand({
  meta: {
    name: "stackify",
    version: "1.0.0",
    description: "Stackify CLI - Manage your Stackify applications and server",
  },
  subCommands: {
    server: {
      meta: {
        name: "server",
        description: "Manage the Stackify server",
      },
      subCommands: {
        start: () => import("./commands/start").then((m) => m.default),
        stop: () => import("./commands/stop").then((m) => m.default),
      },
    },
    deploy: () => import("./commands/deploy").then((m) => m.default),
  },
});

export const runMain = () => _runMain(main);
