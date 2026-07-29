import { WorkspaceHeader } from "../../../components/workspace/workspace-header";
import { requireSession } from "../../../lib/session";

export default async function ProjectsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-canvas">
      <WorkspaceHeader session={session} />
      <main id="main-content">{children}</main>
    </div>
  );
}
