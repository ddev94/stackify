import { Writable } from "stream";
import { pack } from "tar-stream";

type TarStreamFile = {
  name: string;
  content: string;
};

export async function createTarStreamFromFiles(files: TarStreamFile[]) {
  const tarStream = pack();

  for (const file of files) {
    tarStream.entry({ name: file.name }, file.content);
  }

  tarStream.finalize();
  return tarStream;
}

export class BuildOutputStream extends Writable {
  _write(chunk: any, encoding: string, callback: () => void) {
    const lines = chunk.toString().split("\n");
    lines.forEach((line: string) => {
      try {
        const json = JSON.parse(line);
        if (json.stream) {
          console.log(json.stream.trim());
        } else if (json.error) {
          console.error("Error:", json.error);
        }
      } catch (e) {
        // Ignore non-JSON output
      }
    });
    callback();
  }
}
