import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function worker() {
  "use cache";
  return readFile(join(process.cwd(), "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"), "utf8");
}

export async function GET() {
  return new Response(await worker(), { headers: { "Content-Type": "text/javascript; charset=utf-8" } });
}
