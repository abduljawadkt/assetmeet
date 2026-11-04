import { and, eq, gte, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { getUser } from "../../../lib/auth";
import { sameOrigin } from "../../../lib/http";
import { getDb } from "../../../db";
import { deals, events, fees, opportunities, profiles, properties, requirements } from "../../../db/schema";
import { dealInput, feeInput, opportunityInput, propertyInput, requirementInput } from "../../../lib/records";
import {
  brokerageStreams,
  contactReleased,
  dealProblems,
  effectivePlan,
  feeProblems,
  inMemberPool,
  isActiveProperty,
  isActiveRequirement,
  monthStart,
  qualifiedRequirementStatuses,
  quotaFor,
  rewardFor,
} from "../../../lib/rules";

type PropertyRow = typeof properties.$inferSelect;
type RequirementRow = typeof requirements.$inferSelect;
type DealRow = typeof deals.$inferSelect;
type FeeRow = typeof fees.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect;

const tables = { property: properties, requirement: requirements, deal: deals, opportunity: opportunities, fee: fees };
const kind = z.enum(["property", "requirement", "deal", "opportunity", "fee"]);
const today = () => new Date().toISOString().slice(0, 10);

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

// Collected brokerage per deal: the base for contributor rewards.
function collectedBrokerage(feeRows: FeeRow[]) {
  const out = new Map<string, number>();
  for (const f of feeRows)
    if (f.linkKind === "deal" && f.status === "Collected" && brokerageStreams.includes(f.stream))
      out.set(f.linkId, (out.get(f.linkId) ?? 0) + f.amount);
  return out;
}

const fullProperty = (x: PropertyRow) => ({ ...strip(x), kind: "property" });
const fullRequirement = (x: RequirementRow) => ({ ...strip(x), kind: "requirement" });
const fullDeal = (x: DealRow, collected: Map<string, number>) => ({
  ...strip(x),
  created: x.created,
  reward: rewardFor(x.rewardRate, collected.get(x.id) ?? 0),
  kind: "deal",
});

// What a business sees of a property shortlisted for it: no contributor, and the
// owner's contact only once a mandate is signed.
function sharedProperty(x: PropertyRow) {
  return {
    ...omit(fullProperty(x), ["source"]),
    source: "",
    ownerContact: contactReleased(x) ? x.ownerContact : "",
    shared: true,
  };
}

// Anonymised property offered to a subscriber for self-service matching:
// data intelligence, never the owner's identity or contact.
function poolProperty(x: PropertyRow) {
  return {
    ...sharedProperty(x),
    name: `${x.type} · ${x.locality ? `${x.locality}, ` : ""}${x.district}`,
    ownerContact: "",
    pool: true,
  };
}

// What an owner or contributor sees of a requirement: never the business's name.
function sharedRequirement(x: RequirementRow, pool = false) {
  return { ...fullRequirement(x), name: `${x.type} requirement · ${x.district}`, shared: true, pool };
}

// Deal fields shown to the business or owner side. Mandate terms, notes and
// assignments stay with the AssetMeet team.
function sharedDeal(d: DealRow, ownRequirement: boolean, collected: Map<string, number>) {
  return {
    kind: "deal",
    id: d.id,
    name: ownRequirement ? d.name : "Interest from a business",
    propertyId: d.propertyId,
    requirementId: d.requirementId,
    stage: d.stage,
    optIn: d.optIn,
    leadSource: "",
    value: 0,
    mandateSigned: d.mandateSigned,
    mandateParty: d.mandateParty,
    exclusivity: "",
    trigger: "",
    assignee: "",
    nextAction: "",
    followup: "",
    notes: "",
    // Businesses never see contributor rewards.
    sourceTier: ownRequirement ? "Data contributor" : d.sourceTier,
    rewardRate: ownRequirement ? 0 : d.rewardRate,
    payoutStatus: ownRequirement ? "Not due" : d.payoutStatus,
    reward: ownRequirement ? 0 : rewardFor(d.rewardRate, collected.get(d.id) ?? 0),
    created: d.created,
    shared: true,
  };
}

async function profileFor(userId: string) {
  const [row] = await getDb().select().from(profiles).where(eq(profiles.owner, userId));
  return row ?? null;
}

const planOf = (p: ProfileRow) => effectivePlan(p.plan, p.planUntil, today());

export async function GET() {
  const user = await getUser();
  if (!user) return error("Sign in required", 401);
  const db = getDb();
  const profile = await profileFor(user.userId);

  if (profile?.role === "Staff") {
    const [p, r, d, o, f] = await Promise.all([
      db.select().from(properties),
      db.select().from(requirements),
      db.select().from(deals),
      db.select().from(opportunities),
      db.select().from(fees),
    ]);
    const collected = collectedBrokerage(f);
    return Response.json([
      ...p.map(fullProperty),
      ...r.map(fullRequirement),
      ...d.map((x) => fullDeal(x, collected)),
      ...o.map((x) => ({ ...strip(x), kind: "opportunity" })),
      ...f.map((x) => ({ ...strip(x), kind: "fee" })),
    ]);
  }

  const [p, r] = await Promise.all([
    db.select().from(properties).where(eq(properties.owner, user.userId)),
    db.select().from(requirements).where(eq(requirements.owner, user.userId)),
  ]);
  const ownProps = p.map((x) => x.id);
  const ownReqs = r.map((x) => x.id);

  // Deals that involve this user's records, shown read-only.
  const involved =
    ownProps.length || ownReqs.length
      ? await db
          .select()
          .from(deals)
          .where(
            or(
              ownReqs.length ? inArray(deals.requirementId, ownReqs) : undefined,
              ownProps.length ? inArray(deals.propertyId, ownProps) : undefined,
            ),
          )
      : [];
  const dealFees = involved.length
    ? await db.select().from(fees).where(inArray(fees.linkId, involved.map((d) => d.id)))
    : [];
  const collected = collectedBrokerage(dealFees);

  const shortlisted = involved.map((d) => d.propertyId).filter((id) => !ownProps.includes(id));
  const behindInterest = involved.map((d) => d.requirementId).filter((id) => !ownReqs.includes(id));
  const otherProps = shortlisted.length ? await db.select().from(properties).where(inArray(properties.id, shortlisted)) : [];
  const otherReqs = behindInterest.length
    ? await db.select().from(requirements).where(inArray(requirements.id, behindInterest))
    : [];

  // Subscribers get the anonymised member pool for self-service matching. A record
  // already shared with them through a deal stays as shared and is marked as pool too.
  const paid = profile && planOf(profile) !== "Free";
  const poolProps = paid && ownReqs.length
    ? (await db.select().from(properties).where(inArray(properties.type, [...new Set(r.map((x) => x.type))])))
        .filter((x) => inMemberPool(x) && !ownProps.includes(x.id))
    : [];
  const poolReqs = paid && ownProps.length
    ? (await db.select().from(requirements).where(inArray(requirements.status, qualifiedRequirementStatuses)))
        .filter((x) => !ownReqs.includes(x.id))
    : [];
  const poolPropIds = new Set(poolProps.map((x) => x.id));
  const poolReqIds = new Set(poolReqs.map((x) => x.id));
  const sharedPropIds = new Set(otherProps.map((x) => x.id));
  const sharedReqIds = new Set(otherReqs.map((x) => x.id));

  return Response.json([
    ...p.map(fullProperty),
    ...r.map(fullRequirement),
    ...otherProps.map((x) => ({ ...sharedProperty(x), pool: poolPropIds.has(x.id) })),
    ...otherReqs.map((x) => sharedRequirement(x, poolReqIds.has(x.id))),
    ...poolProps.filter((x) => !sharedPropIds.has(x.id)).map(poolProperty),
    ...poolReqs.filter((x) => !sharedReqIds.has(x.id)).map((x) => sharedRequirement(x, true)),
    ...involved.map((d) => sharedDeal(d, ownReqs.includes(d.requirementId), collected)),
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
    const quota = quotaFor(planOf(profile), profile.role);

    let data: Record<string, unknown>;
    if (body.kind === "property") {
      const input = propertyInput.parse(body.data);
      const [old] = body.id ? await db.select().from(properties).where(eq(properties.id, body.id)) : [];
      if (!staff) {
        // Independent verification and the mandate-backed statuses are set by the team.
        input.verification = (old?.verification as typeof input.verification) ?? "Not checked";
        if (!["Mapped", "Owner confirmed", "Withdrawn"].includes(input.status))
          input.status = (old?.status as typeof input.status) ?? "Mapped";
        if (input.visibility === "Members" && !input.consent)
          return error("Members can see this property only after the owner has given permission to market it");
        if (quota.assets !== null && isActiveProperty(input) && (!old || !isActiveProperty(old))) {
          const mine = await db.select({ status: properties.status }).from(properties).where(eq(properties.owner, owner));
          if (mine.filter(isActiveProperty).length >= quota.assets)
            return error(`Your plan allows ${quota.assets} active assets. Withdraw one or upgrade your plan.`, 403);
        }
      }
      data = input;
    } else if (body.kind === "requirement") {
      const input = requirementInput.parse(body.data);
      const [old] = body.id ? await db.select().from(requirements).where(eq(requirements.id, body.id)) : [];
      if (!staff) {
        // Qualification is the team's call.
        input.status = (old?.status as typeof input.status) ?? "Draft";
        if (quota.demands !== null && !old) {
          const mine = await db.select({ status: requirements.status }).from(requirements).where(eq(requirements.owner, owner));
          if (mine.filter(isActiveRequirement).length >= quota.demands)
            return error(`Your plan allows ${quota.demands} active ${quota.demands === 1 ? "demand" : "demands"}. Upgrade your plan to post more.`, 403);
        }
      }
      data = input;
    } else if (body.kind === "deal") {
      const deal = dealInput.parse(body.data);
      const [property] = await db.select().from(properties).where(eq(properties.id, deal.propertyId));
      const [requirement] = await db.select().from(requirements).where(eq(requirements.id, deal.requirementId));
      if (!property || !requirement) return error("Choose an existing property and requirement");
      if (!body.id) {
        const existing = await db
          .select({ id: deals.id })
          .from(deals)
          .where(and(eq(deals.propertyId, deal.propertyId), eq(deals.requirementId, deal.requirementId)));
        if (existing.length) return error("This match is already with the Deal Desk.");
      }
      if (staff) {
        const linked = body.id ? await db.select().from(fees).where(eq(fees.linkId, body.id)) : [];
        const problems = dealProblems(deal, property, collectedBrokerage(linked).get(body.id ?? "") ?? 0);
        if (problems.length) return error(problems[0]);
        data = deal;
      } else {
        // A subscriber saves a match and asks the Deal Desk for an introduction.
        if (body.id) return error("Deals are managed by the AssetMeet team", 403);
        if (planOf(profile) === "Free") return error("Saved matching is part of a paid plan. See Plan.", 403);
        const forOwnDemand = requirement.owner === owner && inMemberPool(property);
        const forOwnAsset =
          property.owner === owner && qualifiedRequirementStatuses.includes(requirement.status);
        if (!forOwnDemand && !forOwnAsset) return error("You can request introductions only for your own records", 403);
        const used = await db
          .select({ id: deals.id })
          .from(deals)
          .where(and(eq(deals.owner, owner), gte(deals.created, monthStart(Date.now()))));
        if (used.length >= quota.matches)
          return error(`You have used all ${quota.matches} saved matches for this month.`, 403);
        data = {
          ...dealInput.parse({ name: `${property.type} · ${property.district} for ${requirement.name}`, propertyId: property.id, requirementId: requirement.id, stage: "Flagged" }),
          leadSource: `Member request (${forOwnDemand ? "business" : "owner"})`,
          optIn: deal.optIn,
        };
      }
    } else if (body.kind === "opportunity") {
      if (!staff) return error("Opportunities are run by the AssetMeet team", 403);
      const input = opportunityInput.parse(body.data);
      const [requirement] = await db.select().from(requirements).where(eq(requirements.id, input.requirementId));
      if (!requirement) return error("Choose an existing demand");
      if (input.propertyId) {
        const [site] = await db.select({ id: properties.id }).from(properties).where(eq(properties.id, input.propertyId));
        if (!site) return error("Choose an existing site or leave it empty");
      }
      data = input;
    } else {
      if (!staff) return error("Fees are recorded by the AssetMeet team", 403);
      const input = feeInput.parse(body.data);
      let linkedDeal: DealRow | null = null;
      if (input.linkKind === "deal") {
        [linkedDeal] = await db.select().from(deals).where(eq(deals.id, input.linkId));
        if (!linkedDeal) return error("Choose an existing deal");
      } else if (input.linkKind === "opportunity") {
        const [o] = await db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.id, input.linkId));
        if (!o) return error("Choose an existing opportunity");
      } else input.linkId = "";
      const siblings = input.linkId
        ? (await db.select({ id: fees.id, status: fees.status }).from(fees).where(eq(fees.linkId, input.linkId))).filter(
            (x) => x.id !== body.id && x.status !== "Cancelled",
          ).length
        : 0;
      const problems = feeProblems(input, linkedDeal, siblings);
      if (problems.length) return error(problems[0]);
      data = input;
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
      // A new development opportunity marks its demand as a development lead.
      if (body.kind === "opportunity" && !body.id)
        await tx
          .update(requirements)
          .set({ status: "Development lead", updated: now })
          .where(eq(requirements.id, String(data.requirementId)));
      await tx.insert(events).values({
        id: crypto.randomUUID(),
        owner,
        record: id,
        action: `${body.id ? "Updated" : "Created"} ${body.kind}`,
        created: now,
      });
    });
    return Response.json({ ...data, id, kind: body.kind, created: now });
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
  if ((k === "deal" || k === "opportunity" || k === "fee") && !staff)
    return error("This record is managed by the AssetMeet team", 403);
  if (k === "property" || k === "requirement") {
    const column = k === "property" ? deals.propertyId : deals.requirementId;
    const oColumn = k === "property" ? opportunities.propertyId : opportunities.requirementId;
    const [linked, linkedOpp] = await Promise.all([
      db.select({ id: deals.id }).from(deals).where(eq(column, id)),
      db.select({ id: opportunities.id }).from(opportunities).where(eq(oColumn, id)),
    ]);
    if (linked.length || linkedOpp.length)
      return error("This record is part of a deal or opportunity and cannot be deleted. Withdraw or close it instead.");
  }
  if (k === "deal" || k === "opportunity") {
    const linked = await db.select({ id: fees.id }).from(fees).where(eq(fees.linkId, id));
    if (linked.length) return error("Fees are recorded against this. Cancel or relink them first.");
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
