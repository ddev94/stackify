import AdmZip from "adm-zip";
import axios from "axios";
import chalk from "chalk";
import { defineCommand } from "citty";
import { consola } from "consola";
import FormData from "form-data";
import fs from "fs";
import { createJiti } from "jiti";
import ora from "ora";
import { join, resolve } from "pathe";
import { StackifyConfig } from "stackify-core";

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
    let stackConfigFileName = "";
    if (fs.existsSync(join(workdir, "stackify.config.ts"))) {
      stackConfigFileName = "stackify.config.ts";
    }

    if (fs.existsSync(join(workdir, "stackify.config.js"))) {
      stackConfigFileName = "stackify.config.js";
    }

    if (!stackConfigFileName) {
      consola.error(
        "No stackify.config.ts or stackify.config.js found in the working directory."
      );
      process.exit(1);
    }

    if (!fs.existsSync(join(workdir, ".stackify"))) {
      fs.mkdirSync(join(workdir, ".stackify"));
    }
    const jiti = createJiti(workdir, { cache: false });
    const config = await jiti.import<StackifyConfig>(
      "./" + stackConfigFileName,
      {
        default: true,
      }
    );

    if (!config.rest?.url) {
      consola.error("No rest.url found in", stackConfigFileName);
      spinner.fail("Deployment failed!");
      process.exit(1);
    }

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
      .post(config.rest?.url + "/api/deploy", formData, {
        headers: formData.getHeaders(),
      })
      .then((res) => {
        if (res.status !== 200) {
          consola.error(res.data);
          spinner.fail("Deployment failed!");
          process.exit(1);
        } else {
          spinner.succeed("Deployment successful!");
        }
      });
  },
});
