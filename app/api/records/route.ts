import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getUser } from "../../../lib/supabase/server";
import { sameOrigin } from "../../../lib/http";
import { getDb } from "../../../db";
import { deals, events, profiles, properties, requirements } from "../../../db/schema";
import {
  dealInput,
  propertyInput,
  requirementInput,
  stagesNeedingConsent,
} from "../../../lib/records";

type PropertyRow = typeof properties.$inferSelect;
type RequirementRow = typeof requirements.$inferSelect;
type DealRow = typeof deals.$inferSelect;

const tables = { property: properties, requirement: requirements, deal: deals };
const kind = z.enum(["property", "requirement", "deal"]);

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function omit<T extends object, K extends keyof T>(row: T, keys: K[]): Omit<T, K> {
  const rest = { ...row };
  for (const k of keys) delete rest[k];
  return rest;
}

const strip = <T extends { owner: string; created: number; updated: number }>(row: T) =>
  omit(row, ["owner", "created", "updated"]);

const fullProperty = (x: PropertyRow) => ({ ...strip(x), kind: "property" });
const fullRequirement = (x: RequirementRow) => ({ ...strip(x), kind: "requirement" });
const fullDeal = (x: DealRow) => ({ ...strip(x), kind: "deal" });

// What a business sees of a property shortlisted for it: no contributor, and the
// owner's contact only once a mandate is signed.
function sharedProperty(x: PropertyRow) {
  return {
    ...omit(fullProperty(x), ["source"]),
    ownerContact: x.verification === "Mandate signed" ? x.ownerContact : "",
    shared: true,
  };
}

// What an owner or contributor sees of the requirement behind interest in their property.
function sharedRequirement(x: RequirementRow) {
  return { ...fullRequirement(x), name: `${x.type} requirement · ${x.district}`, shared: true };
}

async function profileFor(userId: string) {
  const [row] = await getDb().select().from(profiles).where(eq(profiles.owner, userId));
  return row ?? null;
}

export async function GET() {
  const user = await getUser();
  if (!user) return error("Sign in required", 401);
  const db = getDb();
  const profile = await profileFor(user.userId);

  if (profile?.role === "Staff") {
    const [p, r, d] = await Promise.all([
      db.select().from(properties),
      db.select().from(requirements),
      db.select().from(deals),
    ]);
    return Response.json([...p.map(fullProperty), ...r.map(fullRequirement), ...d.map(fullDeal)]);
  }

  const [p, r] = await Promise.all([
    db.select().from(properties).where(eq(properties.owner, user.userId)),
    db.select().from(requirements).where(eq(requirements.owner, user.userId)),
  ]);
  const ownProps = p.map((x) => x.id);
  const ownReqs = r.map((x) => x.id);

  // Deals created by staff that involve this user's records, shown read-only.
  const forReqs = ownReqs.length ? await db.select().from(deals).where(inArray(deals.requirementId, ownReqs)) : [];
  const forProps = ownProps.length ? await db.select().from(deals).where(inArray(deals.propertyId, ownProps)) : [];

  const shortlisted = forReqs.map((d) => d.propertyId).filter((id) => !ownProps.includes(id));
  const behindInterest = forProps.map((d) => d.requirementId).filter((id) => !ownReqs.includes(id));
  const otherProps = shortlisted.length
    ? await db.select().from(properties).where(inArray(properties.id, shortlisted))
    : [];
  const otherReqs = behindInterest.length
    ? await db.select().from(requirements).where(inArray(requirements.id, behindInterest))
    : [];

  const seen = new Set<string>();
  const sharedDeals = [...forReqs, ...forProps]
    .filter((d) => !seen.has(d.id) && seen.add(d.id))
    .map((d) => {
      const own = ownReqs.includes(d.requirementId);
      // Businesses do not see contributor rewards; owners do not see the business's deal name.
      return {
        ...fullDeal(d),
        name: own ? d.name : "Interest from a business",
        collected: own ? 0 : d.collected,
        rewardRate: own ? 0 : d.rewardRate,
        shared: true,
      };
    });

  return Response.json([
    ...p.map(fullProperty),
    ...r.map(fullRequirement),
    ...otherProps.map(sharedProperty),
    ...otherReqs.map(sharedRequirement),
    ...sharedDeals,
  ]);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return error("Sign in required", 401);
  if (!sameOrigin(req)) return error("Invalid origin", 403);
  try {
    const body = z
      .object({ kind, id: z.string().uuid().optional(), data: z.unknown() })
      .parse(await req.json());
    const db = getDb();
    const owner = user.userId;
    const profile = await profileFor(owner);
    if (!profile) return error("Create your profile before adding records", 403);
    const staff = profile.role === "Staff";

    let data: Record<string, unknown>;
    if (body.kind === "property") data = propertyInput.parse(body.data);
    else if (body.kind === "requirement") data = requirementInput.parse(body.data);
    else {
      if (!staff) return error("Deals are created by the AssetMeet team", 403);
      const deal = dealInput.parse(body.data);
      const [property] = await db.select().from(properties).where(eq(properties.id, deal.propertyId));
      const [requirement] = await db.select().from(requirements).where(eq(requirements.id, deal.requirementId));
      if (!property || !requirement) return error("Choose an existing property and requirement");
      if (stagesNeedingConsent.includes(deal.stage) && !property.consent)
        return error("Record the owner's permission on the property before moving this deal forward");
      if (!body.id) {
        const existing = await db
          .select({ id: deals.id })
          .from(deals)
          .where(and(eq(deals.propertyId, deal.propertyId), eq(deals.requirementId, deal.requirementId)));
        if (existing.length) return error("This opportunity already exists. Open Deals to update it.");
      }
      data = deal;
    }

    const table = tables[body.kind];
    const now = Date.now();
    const id = body.id ?? crypto.randomUUID();
    // Staff may edit any record; everyone else only their own.
    const scope = staff ? eq(table.id, id) : and(eq(table.id, id), eq(table.owner, owner));
    if (body.id) {
      const old = await db.select({ id: table.id }).from(table).where(scope);
      if (!old.length) return error("Record not found", 404);
    }
    await db.transaction(async (tx) => {
      if (body.id)
        await tx
          .update(table)
          .set({ ...data, updated: now })
          .where(scope);
      else
        await tx
          .insert(table)
          .values({ ...data, id, owner, created: now, updated: now } as typeof table.$inferInsert);
      await tx.insert(events).values({
        id: crypto.randomUUID(),
        owner,
        record: id,
        action: `${body.id ? "Updated" : "Created"} ${body.kind}`,
        created: now,
      });
    });
    return Response.json({ ...data, id, kind: body.kind });
  } catch (e) {
    return error(e instanceof z.ZodError ? e.issues[0].message : "Unable to save this record");
  }
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return error("Sign in required", 401);
  if (!sameOrigin(req)) return error("Invalid origin", 403);
  const url = new URL(req.url);
  const parsed = z
    .object({ kind, id: z.string().uuid() })
    .safeParse({ kind: url.searchParams.get("kind"), id: url.searchParams.get("id") });
  if (!parsed.success) return error("Choose a record to delete");
  const { kind: k, id } = parsed.data;
  const owner = user.userId;
  const db = getDb();
  const staff = (await profileFor(owner))?.role === "Staff";
  const table = tables[k];
  if (k === "deal" && !staff) return error("Deals are managed by the AssetMeet team", 403);
  if (k !== "deal") {
    const column = k === "property" ? deals.propertyId : deals.requirementId;
    const linked = await db.select({ id: deals.id }).from(deals).where(eq(column, id));
    if (linked.length) return error("This record is part of a deal and cannot be deleted");
  }
  const scope = staff ? eq(table.id, id) : and(eq(table.id, id), eq(table.owner, owner));
  const removed = await db.delete(table).where(scope).returning({ id: table.id });
  if (!removed.length) return error("Record not found", 404);
  await db.insert(events).values({
    id: crypto.randomUUID(),
    owner,
    record: id,
    action: `Deleted ${k}`,
    created: Date.now(),
  });
  return Response.json({ id });
}
