import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { summarize } from "@/lib/game";
import type { Group } from "@/lib/types";

async function groupsIndex() {
  "use cache";
  const groups: Group[] = JSON.parse(await readFile(join(process.cwd(), "public/data/groups.json"), "utf8"));
  return JSON.stringify(groups.map(summarize));
}

export async function GET() {
  return new Response(await groupsIndex(), { headers: { "Content-Type": "application/json" } });
}
