import Docker from "dockerode";
import { createError, defineEventHandler, readMultipartFormData } from "h3";
import { StackifyConfig } from "stackify-core";
import unzipper from "unzipper";
import {
  BuildOutputStream,
  createTarStreamFromFiles,
  TarStreamFile,
} from "../../../utils/stream";
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export default defineEventHandler(async (event) => {
  console.log("Received deployment request");
  let config: StackifyConfig | null = {
    name: "",
    nodeVersion: "20",
    platform: "vite",
  };
  let containerPort = 0;
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files uploaded",
    });
  }

  const tarStreamFiles: TarStreamFile[] = [];
  for (const part of formData) {
    if (part.name === "file" && part.data && part.filename) {
      const directory = await unzipper.Open.buffer(part.data);
      for (const file of directory.files) {
        const content = await file.buffer();
        if (content.toString()) {
          tarStreamFiles.push({ name: file.path, content });
        }
      }
    }

    if (part.name === "config" && part.data) {
      config = JSON.parse(part.data.toString()) as StackifyConfig;
    }

    if (part.name === "containerPort" && part.data) {
      containerPort = parseInt(part.data.toString());
    }
  }

  if (!config.server?.domain) {
    throw createError({
      statusCode: 400,
      statusMessage: "No config `server.domain` provided",
    });
  }

  if (!containerPort) {
    throw createError({
      statusCode: 400,
      statusMessage: "No containerPort provided",
    });
  }

  const url = new URL(config.server?.domain);

  const protocol = url.protocol;
  const isSSL = protocol === "https:";

  if (!config.name) {
    throw createError({
      statusCode: 400,
      statusMessage: "No config `name` provided",
    });
  }

  if (!/^[a-zA-Z0-9-]+$/.test(config.name)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Invalid config `name`. Only alphanumeric characters and hyphens are allowed.",
    });
  }

  tarStreamFiles.push({
    name: "Dockerfile",
    content: `
          FROM node:${config.nodeVersion}-alpine
          WORKDIR /app
          COPY . .
          RUN npm install
          RUN npm run build
          EXPOSE ${containerPort}
          CMD ["npm", "run", "preview"]`,
  });
  const tarStream = await createTarStreamFromFiles(tarStreamFiles);

  const stackifyContainers = await docker.listContainers({
    all: true,
    filters: {
      name: [config.name || "stackify-app-vite-react"],
    },
  });

  for (const containerInfo of stackifyContainers) {
    try {
      const container = docker.getContainer(containerInfo.Id);
      await container.remove({ force: true });
    } catch {}
  }
  const buildStream = await docker.buildImage(tarStream, {
    t: `stackify/${config.name}:latest`,
  });

  await new Promise((resolve, reject) => {
    buildStream.pipe(new BuildOutputStream());
    buildStream.on("end", resolve);
    buildStream.on("error", reject);
  });

  const labels: Record<string, string> = {};
  labels["traefik.enable"] = "true";
  labels[
    `traefik.http.services.${config.name}.loadbalancer.server.port`
  ] = `${containerPort}`;

  labels[`traefik.http.routers.${config.name}.entrypoints`] = isSSL
    ? "websecure"
    : "web";

  if (config.subDomain) {
    labels["traefik.enable"] = "true";
    labels[
      `traefik.http.routers.${config.name}.rule`
    ] = `Host(\`${config.subDomain}.${url.hostname}\`)`;
    if (config.pathPrefix) {
      labels[
        `traefik.http.routers.${config.name}.rule`
      ] += ` && PathPrefix(\`${config.pathPrefix}\`)`;
    }
  } else {
    if (config.pathPrefix) {
      labels[
        `traefik.http.routers.${config.name}.rule`
      ] = `PathPrefix(\`${config.pathPrefix}\`)`;
    }
  }

  const portBindings: Record<string, Array<{ HostPort: string }>> = {};

  const container = await docker.createContainer({
    Image: `stackify/${config.name}:latest`,
    name: "stackify-" + config.name,
    Tty: true, // Enable TTY for interactive exec sessions
    OpenStdin: true, // Allow attaching stdin
    HostConfig: {
      PortBindings: portBindings,
    },
    Labels: labels,
  });

  await container.start();
  console.log("Container started successfully");
  const pathPrefix = config?.pathPrefix || "";
  return {
    url: `${protocol}//${config.subDomain}.${url.host}${pathPrefix}`,
  };
});
