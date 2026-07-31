import { NewProjectForm } from "../../../../components/projects/new-project-form";

export const metadata = {
  title: "Create project",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-[880px] px-5 py-8 md:px-8 md:py-10">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-[-0.025em]">
          New project
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Add the basic site details.
        </p>
      </div>
      <NewProjectForm submissionToken={crypto.randomUUID()} />
    </div>
  );
}
