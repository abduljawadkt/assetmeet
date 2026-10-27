import { eq } from "drizzle-orm";
import { z } from "zod";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { events, profiles } from "../../../db/schema";
import { profileInput } from "../../../lib/records";

const links = {
  signIn: chatGPTSignInPath("/?view=app"),
  signOut: chatGPTSignOutPath("/"),
};

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ authenticated: false, profile: null, ...links });
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
      }
    : null;
  return Response.json({ authenticated: true, name: user.displayName, profile, ...links });
}

export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to create your profile" }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
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
    await db.batch([
      db
        .insert(profiles)
        .values({ ...value, owner: user.userId, verification, created: now, updated: now })
        .onConflictDoUpdate({ target: profiles.owner, set: { ...value, verification, updated: now } }),
      db.insert(events).values({
        id: crypto.randomUUID(),
        owner: user.userId,
        record: `profile:${user.userId}`,
        action: "Profile saved",
        created: now,
      }),
    ]);
    return Response.json({ ...value, verification });
  } catch (e) {
    return Response.json(
      { error: e instanceof z.ZodError ? e.issues[0].message : "Unable to save your profile" },
      { status: 400 },
    );
  }
}
