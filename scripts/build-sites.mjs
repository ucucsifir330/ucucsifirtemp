import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

const distDirectory = join(process.cwd(), "dist");
const clientDirectory = join(distDirectory, "client");
const serverDirectory = join(distDirectory, "server");
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

await mkdir(clientDirectory, { recursive: true });

for (const entry of await readdir(distDirectory, { withFileTypes: true })) {
  if (entry.name === "client" || entry.name === "server") {
    continue;
  }

  await rename(join(distDirectory, entry.name), join(clientDirectory, entry.name));
}

await mkdir(serverDirectory, { recursive: true });
await writeFile(join(serverDirectory, "index.js"), workerEntry, "utf8");
