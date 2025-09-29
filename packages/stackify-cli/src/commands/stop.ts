import chalk from "chalk";
import { defineCommand } from "citty";
import Docker from "dockerode";
import ora from "ora";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export default defineCommand({
  meta: {
    name: "stop",
    description: "Stop the stackify service.",
  },
  async run() {
    const spinner = ora(chalk.cyan("Stopping stackify service...")).start();

    const stackifyContainers = await docker.listContainers({
      all: true,
      filters: {
        name: ["stackify-"],
      },
    });

    for (const containerInfo of stackifyContainers) {
      try {
        const container = docker.getContainer(containerInfo.Id);
        await container.remove({ force: true });
      } catch {}
    }
    spinner.succeed(chalk.green("Stackify service stopped."));
  },
});
