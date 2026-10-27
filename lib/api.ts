import type { Deal, Kind, Profile, Property, Requirement } from "./records";

export type Row = Property | Requirement | Deal;
export type Session = {
  authenticated: boolean;
  name?: string;
  profile: Profile | null;
};

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(body.error || "Something went wrong. Try again.");
  return body as unknown as T;
}

export const api = {
  session: () => call<Session>("/api/profile"),
  saveProfile: (data: unknown) => call<Profile>("/api/profile", { method: "POST", body: JSON.stringify(data) }),
  records: () => call<Row[]>("/api/records"),
  save: (kind: Kind, data: unknown, id?: string) =>
    call<Row>("/api/records", { method: "POST", body: JSON.stringify({ kind, data, id }) }),
  remove: (kind: Kind, id: string) =>
    call<{ id: string }>(`/api/records?kind=${kind}&id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};
