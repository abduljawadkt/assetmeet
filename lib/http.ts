// Behind Hostinger's proxy, request.url can carry the internal address
// (http://localhost:3000), so the public host comes from forwarded headers.

// Writes must come from this site's own pages.
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
