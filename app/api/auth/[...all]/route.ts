import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "../../../../lib/auth";

// Sign-in endpoints: sending the email link, verifying it, reading and ending the session.
export const GET = (req: Request) => toNextJsHandler(getAuth()).GET(req);
export const POST = (req: Request) => toNextJsHandler(getAuth()).POST(req);
