import Landing from "./landing";
import Workspace from "./workspace";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params.view === "app") {
    const role = typeof params.role === "string" ? params.role : undefined;
    return <Workspace startRole={role} demo={params.demo === "1"} signinFailed={params.signin === "failed"} />;
  }
  return <Landing />;
}
