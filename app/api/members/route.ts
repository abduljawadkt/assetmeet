import { eq } from "drizzle-orm";
import { z } from "zod";
import { getUser } from "../../../lib/auth";
import { sameOrigin } from "../../../lib/http";
import { getDb } from "../../../db";
import { events, profiles, user as users } from "../../../db/schema";
import { planInput } from "../../../lib/records";

// Members and their subscription plans, for the AssetMeet team only.
// Payment is taken outside the app for now; the team records the plan and the
// date it is paid up to, and it lapses to Free after that date.

async function isStaff(userId: string) {
  const [row] = await getDb().select({ role: profiles.role }).from(profiles).where(eq(profiles.owner, userId));
  return row?.role === "Staff";
}

export async function GET() {
  const me = await getUser();
  if (!me) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!(await isStaff(me.userId))) return Response.json({ error: "Only the AssetMeet team can see members" }, { status: 403 });
  const rows = await getDb()
    .select({
      owner: profiles.owner,
      name: profiles.name,
      organisation: profiles.organisation,
      role: profiles.role,
      plan: profiles.plan,
      planUntil: profiles.planUntil,
      email: users.email,
      created: profiles.created,
    })
    .from(profiles)
    .leftJoin(users, eq(users.id, profiles.owner));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const me = await getUser();
  if (!me) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!sameOrigin(req)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!(await isStaff(me.userId))) return Response.json({ error: "Only the AssetMeet team can change plans" }, { status: 403 });
  try {
    const input = planInput.parse(await req.json());
    if (input.plan !== "Free" && !input.planUntil) throw new Error("Enter the date this plan is paid up to");
    const db = getDb();
    const now = Date.now();
    const updated = await db.transaction(async (tx) => {
      const rows = await tx
        .update(profiles)
        .set({ plan: input.plan, planUntil: input.plan === "Free" ? "" : input.planUntil, updated: now })
        .where(eq(profiles.owner, input.owner))
        .returning({ owner: profiles.owner });
      if (rows.length)
        await tx.insert(events).values({
          id: crypto.randomUUID(),
          owner: me.userId,
          record: `profile:${input.owner}`,
          action: `Plan set to ${input.plan}${input.plan === "Free" ? "" : ` until ${input.planUntil}`}`,
          created: now,
        });
      return rows.length;
    });
    if (!updated) return Response.json({ error: "Member not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : "Unable to save";
    return Response.json({ error: message }, { status: 400 });
  }
}
