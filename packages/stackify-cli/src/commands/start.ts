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

    const image = await docker.pull("playlistduong/stackify-rest:v1", {});
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(image, (err, res) =>
        err ? reject(err) : resolve(res),
      );
    });

    const whoamiContainer = await docker.createContainer({
      Image: "playlistduong/stackify-rest:v1",
      name: "stackify-rest",
      Labels: {
        "traefik.enable": "true",
        "traefik.http.routers.rest.rule":
          "PathPrefix(`/rest`)",
        "traefik.http.routers.rest.entrypoints": "web",
        "traefik.http.services.rest.loadbalancer.server.port": "3000",
      },
      HostConfig: {
        Binds: ["/var/run/docker.sock:/var/run/docker.sock:rw"],
      },
    });

    await whoamiContainer.start();

    spinner.succeed(chalk.green("Stackify service started successfully!"));

    // Now you can exec into the container with:
    // docker exec -it stackify-reverse-proxy sh
    // (Note: traefik image may not have bash, but sh should be available)
    const reserveProxyUrl = `http://localhost:${proxyPort}`;
    const restUrl = `http://localhost:${proxyPort}/rest`;
    consola.box(`
    Stackify is running!

    - Reverse Proxy URL: ${chalk.blue(reserveProxyUrl)}

    - You can access the REST API at: ${chalk.blue(restUrl)}

    - To stop the service, run: ${chalk.blue("stackify stop")}
    `);
  },
});
