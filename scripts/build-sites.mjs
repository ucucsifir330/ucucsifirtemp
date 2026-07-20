import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const serverDirectory = join(process.cwd(), "dist", "server");
const workerEntry = `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404 || new URL(request.url).pathname.includes(".")) {
      return response;
    }

    const indexUrl = new URL("/index.html", request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
`;

await mkdir(serverDirectory, { recursive: true });
await writeFile(join(serverDirectory, "index.js"), workerEntry, "utf8");
