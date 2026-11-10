import "server-only";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "../db";
import { account, session, user, verification } from "../db/auth-schema";
import { sendMail } from "./mail";
import { siteUrl } from "./site-url";

// Sign-in requests are accepted from the configured site address, its www /
// non-www twin, and the address this request was actually served on (behind
// Hostinger's proxy that comes from the forwarded headers). Other sites are refused.
async function trustedOrigins(request?: Request) {
  const origins = new Set<string>();
  const configured = siteUrl();
  if (configured) {
    const url = new URL(configured);
    origins.add(url.origin);
    const twin = url.hostname.startsWith("www.") ? url.hostname.slice(4) : `www.${url.hostname}`;
    origins.add(`${url.protocol}//${twin}${url.port ? `:${url.port}` : ""}`);
  }
  const host = request?.headers.get("x-forwarded-host") ?? request?.headers.get("host");
  if (host) {
    const proto = request?.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    origins.add(`${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`);
  }
  return [...origins];
}

// Optional sign-in methods, switched on by the hosting environment.
export const googleEnabled = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const emailEnabled = () => Boolean(process.env.SMTP_HOST);

function createAuth() {
  return betterAuth({
    baseURL: siteUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins,
    database: drizzleAdapter(getDb(), { provider: "pg", schema: { user, session, account, verification } }),
    session: { expiresIn: 60 * 60 * 24 * 30 },
    // Anyone can create an account with an email address (the user ID) and a password.
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true,
      // Password reset needs a mailbox (SMTP_*). Without one the option is hidden in the UI.
      sendResetPassword: async ({ user: u, url }) => {
        await sendMail(
          u.email,
          "Reset your AssetMeet password",
          `Reset your AssetMeet password:\n${url}\n\nThis link works once and expires in an hour. If you did not ask for it, ignore this email.`,
          `<p>Reset your AssetMeet password:</p><p><a href="${url}">Choose a new password</a></p><p>This link works once and expires in an hour. If you did not ask for it, ignore this email.</p>`,
        );
      },
    },
    // "Continue with Google" when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
    socialProviders: googleEnabled()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
          },
        }
      : {},
    // Google sign-in joins an existing account with the same email only when that
    // account's email is already verified, so nobody can pre-register someone
    // else's address with a password and take over their Google sign-in.
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    plugins: [nextCookies()],
  });
}

// Created on first use so builds do not need database credentials.
let instance: ReturnType<typeof createAuth> | null = null;
export function getAuth() {
  instance ??= createAuth();
  return instance;
}

export type User = { userId: string; email: string; displayName: string };

// The signed-in user for this request, or null.
export async function getUser(): Promise<User | null> {
  const result = await getAuth().api.getSession({ headers: await headers() });
  if (!result) return null;
  const { id, email, name } = result.user;
  return { userId: id, email, displayName: name || email };
}
