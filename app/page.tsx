import Landing from "./landing";
import Workspace from "./workspace";
import { emailEnabled, googleEnabled } from "../lib/auth";

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  if (params.view === "app") {
    // Older links used ?role=Business for the requirement path.
    const engine = params.engine === "requirement" || params.role === "Business" ? "requirement" : "property";
    return (
      <Workspace
        engine={engine}
        demo={params.demo === "1"}
        auth={{ google: googleEnabled(), email: emailEnabled(), resetToken: one(params.token), error: one(params.error), signIn: params.mode === "signin" }}
      />
    );
  }
  return <Landing />;
}
