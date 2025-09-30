import chalk from "chalk";
import { defineCommand } from "citty";
import { consola } from "consola";
import Docker from "dockerode";
import ora from "ora";
import { createTraefikDockerfileContent } from "../utils/docker";
import { createTarStreamFromFiles } from "../utils/stream";
import { createTraefikYmlConfig } from "../utils/yml";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export default defineCommand({
  meta: {
    name: "start",
    description: "Start the stackify service.",
  },
  args: {
    port: {
      type: "string",
      description: "The port to expose the reverse proxy on",
      default: "80",
      alias: "p",
    },
    domain: {
      required: true,
      type: "string",
      description: "The domain to use for the reverse proxy",
      alias: "d",
    },
    ssl: {
      type: "boolean",
      description: "Enable SSL (HTTPS) using Let's Encrypt",
      default: false,
      alias: "s",
    },
  },
  async run(context) {
    const spinner = ora(chalk.cyan("Deploying stackify service...")).start();
    const { port, domain, ssl } = context.args;
    const fullDomain = domain + (port === "80" ? "" : `:${port}`);
    const traefikContent = createTraefikYmlConfig(fullDomain, port, ssl);
    const traefikDockerFileContent = createTraefikDockerfileContent();

    const tarStream = await createTarStreamFromFiles([
      {
        name: "Dockerfile",
        content: traefikDockerFileContent,
      },
      {
        name: "acme-dns",
        content: `{"ninety4.tech":{"fulldomain":"6d05b406-dc0c-402e-a3a0-eda43e026382.auth.acme-dns.io","subdomain":"6d05b406-dc0c-402e-a3a0-eda43e026382","username":"b2f84187-68d1-456b-b485-7693518e6ba1","password":"3Y0h3ryR77HJotkinOppKUUrFSbMOdRI6H-jjvcu","server_url":"https://auth.acme-dns.io"}}`,
      },
      {
        name: "acme.json",
        content: "{}",
      },
      {
        name: "traefik.yml",
        content: traefikContent,
      },
    ]);

    const buildStream = await docker.buildImage(tarStream, {
      t: "stackify/reverse-proxy:v1",
      nocache: true,
    });

    await new Promise((resolve, reject) => {
      // buildStream.pipe(new BuildOutputStream());
      buildStream.on("end", resolve);
      buildStream.on("error", reject);
      buildStream.on("data", (chunk) => {
        const data = JSON.parse(chunk.toString());
        if (data.error) {
          reject(new Error(`Docker build failed: ${data.error}`));
        }
      });
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
      Env: [
        "ACME_DNS_API_BASE=https://auth.acme-dns.io",
        "ACME_DNS_STORAGE_PATH=/acme-dns",
      ],
      HostConfig: {
        PortBindings: {
          "80/tcp": [
            {
              HostPort: port,
            },
          ],
          "443/tcp": [
            {
              HostPort: "443",
            },
          ],
        },
        Binds: ["/var/run/docker.sock:/var/run/docker.sock:rw"],
      },
      Cmd: [
        "--api.insecure=true",
        "--providers.docker=true",
        "--entrypoints.web.address=:80",
        ...(ssl ? ["--entrypoints.websecure.address=:443"] : []),
      ],
    });

    await container.start();

    const image = await docker.pull("playlistduong/stackify-rest:v1", {});
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(image, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });

    const whoamiContainer = await docker.createContainer({
      Image: "playlistduong/stackify-rest:v1",
      name: "stackify-rest",
      Labels: {
        "traefik.enable": "true",
        "traefik.http.routers.rest.rule": "PathPrefix(`/rest`)",
        "traefik.http.routers.rest.entrypoints": ssl ? "websecure" : "web",
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
    const reserveProxyUrl = `http://localhost:${port}`;
    const restUrl = `http://localhost:${port}/rest`;
    consola.box(`
Stackify is running!

- Reverse Proxy URL: ${chalk.blue(reserveProxyUrl)}

- You can access the REST API at: ${chalk.blue(restUrl)}

- To stop the service, run: ${chalk.blue(
      "npx stackify-cli stop"
    )} or ${chalk.blue("stackify stop")} if installed globally.
    `);
  },
});
