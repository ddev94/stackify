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
    name: "stackify-app-vite-react",
    rest: {
      url: "http://localhost:3000",
    },
    nodeVersion: "20",
    platform: "vite",
  };
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No files uploaded",
    });
  }
  const tarStreamFiles: TarStreamFile[] = [
    {
      name: "Dockerfile",
      content: `
          FROM node:${config.nodeVersion}-alpine
          WORKDIR /app
          COPY . .
          RUN npm install
          RUN npm run build
          EXPOSE 4173
          CMD ["npm", "run", "preview"]`,
    },
  ];
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
  }

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
    t: "stackify/vite-react:latest",
  });

  await new Promise((resolve, reject) => {
    buildStream.pipe(new BuildOutputStream());
    buildStream.on("end", resolve);
    buildStream.on("error", reject);
  });

  const container = await docker.createContainer({
    Image: "stackify/vite-react:latest",
    name: config.name,
    Tty: true, // Enable TTY for interactive exec sessions
    OpenStdin: true, // Allow attaching stdin
    HostConfig: {
      PortBindings: {
        "4173/tcp": [
          {
            HostPort: "4173",
          },
        ],
      },
    },
  });

  await container.start();
  console.log("Container started successfully");

  return "Deployment process initiated";
});
