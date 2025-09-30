import { defineCommand } from "citty";
import Docker from "dockerode";
import { BuildOutputStream, createTarStreamFromFiles } from "../utils/stream";
import { consola } from "consola";
import chalk from "chalk";
import ora from "ora";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export default defineCommand({
  meta: {
    name: "start",
    description: "Start the stackify service.",
  },
  args: {
    workdir: {
      type: "string",
      description: "The working directory to use",
    },
    "proxy-port": {
      type: "string",
      description: "The port to expose the reverse proxy on",
      default: "80",
      alias: "pp",
    },
  },
  async run(context) {
    const spinner = ora(chalk.cyan("Deploying stackify service...")).start();
    const { proxyPort } = context.args;
    const tarStream = await createTarStreamFromFiles([
      {
        name: "Dockerfile",
        content: `
      FROM traefik:v3
      WORKDIR /app
      `,
      },
    ]);

    const buildStream = await docker.buildImage(tarStream, {
      t: "stackify/reverse-proxy:v1",
    });

    await new Promise((resolve, reject) => {
      buildStream.pipe(new BuildOutputStream());
      buildStream.on("end", resolve);
      buildStream.on("error", reject);
    });

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
    const container = await docker.createContainer({
      Image: "stackify/reverse-proxy:v1",
      name: "stackify-reverse-proxy",
      Tty: true,
      OpenStdin: true,
      HostConfig: {
        PortBindings: {
          "80/tcp": [
            {
              HostPort: proxyPort,
            },
          ],
        },
        Binds: ["/var/run/docker.sock:/var/run/docker.sock:rw"],
      },
      Cmd: [
        "--api.insecure=true",
        "--providers.docker=true",
        "--entrypoints.web.address=:80",
      ],
    });

    await container.start();

    const whoamiContainer = await docker.createContainer({
      Image: "stackify/platform",
      name: "stackify-platform",
      Labels: {
        "traefik.enable": "true",
        "traefik.http.routers.platform.rule": "Host(`localhost`) && PathPrefix(`/platform`)",
        "traefik.http.routers.platform.entrypoints": "web",
        "traefik.http.services.platform.loadbalancer.server.port": "3000",
      },
      HostConfig: {
        Binds: ["/var/run/docker.sock:/var/run/docker.sock:rw"],
      }
    });

    await whoamiContainer.start();

    spinner.succeed(chalk.green("Stackify service started successfully!"));

    // Now you can exec into the container with:
    // docker exec -it stackify-reverse-proxy sh
    // (Note: traefik image may not have bash, but sh should be available)
    const reserveProxyUrl = `http://localhost:${proxyPort}`;
    const platformUrl = `http://localhost:${proxyPort}/platform`;
    consola.box(`
    Stackify Reverse Proxy is running!

    - Proxy URL: ${chalk.blue(reserveProxyUrl)}

    - You can access the platform at: ${chalk.blue(platformUrl)}

    - To stop the service, run: ${chalk.blue("stackify stop")}
    `);
  },
});
