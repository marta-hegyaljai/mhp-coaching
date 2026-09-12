import {desc} from "drizzle-orm";

import {getDb} from "@/db";
import {opsHeartbeats, type OpsHeartbeat} from "@/db/schema";

export async function recordHeartbeat(input: {
  job: string;
  ok: boolean;
  payload: Record<string, unknown>;
  error?: string | null;
}): Promise<void> {
  await getDb().insert(opsHeartbeats).values({
    job: input.job.slice(0, 80),
    ok: input.ok,
    payload: input.payload,
    error: input.error ? input.error.replace(/\s+/g, " ").slice(0, 500) : null,
  });
}

export async function listRecentHeartbeats(limit = 12): Promise<OpsHeartbeat[]> {
  return getDb()
    .select()
    .from(opsHeartbeats)
    .orderBy(desc(opsHeartbeats.createdAt))
    .limit(limit);
}
