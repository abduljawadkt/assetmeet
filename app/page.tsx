import Landing from "./landing";
import Workspace from "./workspace";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  if (params.view === "app") {
    // Older links used ?role=Business for the requirement path.
    const engine = params.engine === "requirement" || params.role === "Business" ? "requirement" : "property";
    return <Workspace engine={engine} demo={params.demo === "1"} signinFailed={params.signin === "failed"} />;
  }
  return <Landing />;
}
