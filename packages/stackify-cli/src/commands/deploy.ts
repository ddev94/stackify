import { defineCommand } from "citty";
import { createJiti } from "jiti";
import { StackifyConfig } from "@stackify/core";
import AdmZip from "adm-zip";
import { join, resolve } from "pathe";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import ora from "ora";
import chalk from "chalk";
import { consola } from "consola";

export default defineCommand({
  meta: {
    name: "deploy",
    description: "Deploy to slackify platform.",
  },
  args: {
    workdir: {
      type: "string",
      description: "The working directory to use",
    },
  },
  async run(context) {
    const spinner = ora(chalk.cyan("Deploying stackify service...")).start();
    const workdir = resolve(context.args.workdir || process.cwd());
    if (!fs.existsSync(join(workdir, "stackify.config.ts"))) {
      consola.error("No stackify.config.ts found in the working directory.");
      process.exit(1);
    }

    if (!fs.existsSync(join(workdir, ".stackify"))) {
      fs.mkdirSync(join(workdir, ".stackify"));
    }
    const jiti = createJiti(workdir);
    const config = await jiti.import<StackifyConfig>("./stackify.config.ts", {
      default: true,
    });

    const zip = new AdmZip();
    zip.addLocalFolder(join(workdir), undefined, (file) => {
      return !file.includes("node_modules") && !file.includes(".stackify");
    });
    zip.writeZip(join(workdir, ".stackify", "deployment.zip"));

    const fileStream = fs.createReadStream(
      join(workdir, ".stackify", "deployment.zip")
    );
    const formData = new FormData();
    formData.append("file", fileStream);
    formData.append("config", JSON.stringify(config));

    axios
      .post("http://localhost:3000/api/deploy", formData, {
        headers: formData.getHeaders(),
      })
      .then((res) => {
        if (res.status !== 200) {
          consola.error("Deployment failed:", res.data);
        } else {
          spinner.succeed("Deployment successful!");
        }
      });
  },
});
