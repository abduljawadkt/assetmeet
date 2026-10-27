// The public site address from NEXT_PUBLIC_SITE_URL, accepted with or without
// "https://" and a trailing slash. Undefined when it is not set or not a valid address.
export function siteUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return undefined;
  }
}
