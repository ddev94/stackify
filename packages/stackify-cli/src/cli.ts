import { defineCommand, runMain as _runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "stackify",
    version: "1.0.0",
    description: "My Awesome CLI App",
  },
  args: {
    name: {
      type: "positional",
      description: "Your name",
      required: true,
    },
    friendly: {
      type: "boolean",
      description: "Use friendly greeting",
    },
  },
  subCommands: {
    start: () => import("./commands/start").then((m) => m.default),
    stop: () => import("./commands/stop").then((m) => m.default),
    deploy: () => import("./commands/deploy").then((m) => m.default),
  },
});

export const runMain = () => _runMain(main);
