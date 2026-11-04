import type { Deal, Fee, Kind, Opportunity, PlanName, Profile, Property, Requirement, Role } from "./records";
import type { Quota } from "./rules";

export type Row = Property | Requirement | Deal | Opportunity | Fee;
export type Usage = { assets: number; demands: number; matches: number };
export type Session = {
  authenticated: boolean;
  name?: string;
  profile: Profile | null;
  plan?: PlanName;
  quota?: Quota;
  usage?: Usage;
};
export type Member = {
  owner: string;
  name: string;
  organisation: string;
  role: Role;
  plan: PlanName;
  planUntil: string;
  email: string | null;
  created: number;
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
  members: () => call<Member[]>("/api/members"),
  setPlan: (owner: string, plan: PlanName, planUntil: string) =>
    call<{ ok: true }>("/api/members", { method: "POST", body: JSON.stringify({ owner, plan, planUntil }) }),
};
