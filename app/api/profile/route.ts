import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { getUser } from "../../../lib/auth";
import { sameOrigin } from "../../../lib/http";
import { getDb } from "../../../db";
import { deals, events, profiles, properties, requirements } from "../../../db/schema";
import { profileInput } from "../../../lib/records";
import { effectivePlan, isActiveProperty, isActiveRequirement, monthStart, quotaFor } from "../../../lib/rules";

// How much of the plan this account is using.
async function usageFor(owner: string) {
  const db = getDb();
  const [p, r, d] = await Promise.all([
    db.select({ status: properties.status }).from(properties).where(eq(properties.owner, owner)),
    db.select({ status: requirements.status }).from(requirements).where(eq(requirements.owner, owner)),
    db
      .select({ id: deals.id })
      .from(deals)
      .where(and(eq(deals.owner, owner), gte(deals.created, monthStart(Date.now())))),
  ]);
  return { assets: p.filter(isActiveProperty).length, demands: r.filter(isActiveRequirement).length, matches: d.length };
}

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ authenticated: false, profile: null });
  const [row] = await getDb().select().from(profiles).where(eq(profiles.owner, user.userId));
  const profile = row
    ? {
        role: row.role,
        name: row.name,
        organisation: row.organisation,
        phone: row.phone,
        licenseNumber: row.licenseNumber,
        licenseAuthority: row.licenseAuthority,
        verification: row.verification,
        plan: row.plan,
        planUntil: row.planUntil,
      }
    : null;
  if (!row) return Response.json({ authenticated: true, name: user.displayName, profile });
  const plan = effectivePlan(row.plan, row.planUntil, new Date().toISOString().slice(0, 10));
  return Response.json({
    authenticated: true,
    name: user.displayName,
    profile,
    plan,
    quota: quotaFor(plan, row.role),
    usage: await usageFor(user.userId),
  });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Sign in to create your profile" }, { status: 401 });
  if (!sameOrigin(req))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  try {
    const parsed = profileInput.parse(await req.json());
    const db = getDb();
    const [existing] = await db.select().from(profiles).where(eq(profiles.owner, user.userId));
    // Staff is granted in the database only; editing a staff profile must not drop it.
    const value = existing?.role === "Staff" ? { ...parsed, role: "Staff" } : parsed;
    const verification =
      existing?.role === "Staff"
        ? existing.verification
        : value.role === "Contributor" && value.licenseNumber
          ? "Submitted · not verified"
          : "Self-declared";
    const now = Date.now();
    await db.transaction(async (tx) => {
      await tx
        .insert(profiles)
        .values({ ...value, owner: user.userId, verification, created: now, updated: now })
        .onConflictDoUpdate({ target: profiles.owner, set: { ...value, verification, updated: now } });
      await tx.insert(events).values({
        id: crypto.randomUUID(),
        owner: user.userId,
        record: `profile:${user.userId}`,
        action: "Profile saved",
        created: now,
      });
    });
    return Response.json({ ...value, verification, plan: existing?.plan ?? "Free", planUntil: existing?.planUntil ?? "" });
  } catch (e) {
    return Response.json(
      { error: e instanceof z.ZodError ? e.issues[0].message : "Unable to save your profile" },
      { status: 400 },
    );
  }
}
