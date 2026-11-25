import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { summarize } from "@/lib/game";
import type { Group } from "@/lib/types";

export const dynamic = "force-static";

export async function GET() {
  const groups: Group[] = JSON.parse(await readFile(join(process.cwd(), "public/data/groups.json"), "utf8"));
  return Response.json(groups.map(summarize));
}
