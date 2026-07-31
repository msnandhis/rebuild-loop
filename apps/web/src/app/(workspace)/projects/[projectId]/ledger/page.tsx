import { redirect } from "next/navigation";

export default async function LegacyMaterialsLedgerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/pack#confirmed-materials`);
}
