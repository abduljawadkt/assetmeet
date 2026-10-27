import "server-only";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "../db";
import { account, session, user, verification } from "../db/auth-schema";
import { sendMail } from "./mail";
import { siteUrl } from "./site-url";

function createAuth() {
  return betterAuth({
    baseURL: siteUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg", schema: { user, session, account, verification } }),
    session: { expiresIn: 60 * 60 * 24 * 30 },
    plugins: [
      magicLink({
        expiresIn: 60 * 60,
        sendMagicLink: async ({ email, url }) => {
          await sendMail(
            email,
            "Your AssetMeet sign-in link",
            `Sign in to AssetMeet:\n${url}\n\nThis link works once and expires in an hour. If you did not ask for it, ignore this email.`,
            `<p>Sign in to AssetMeet:</p><p><a href="${url}">Sign in</a></p><p>This link works once and expires in an hour. If you did not ask for it, ignore this email.</p>`,
          );
        },
      }),
      nextCookies(),
    ],
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
