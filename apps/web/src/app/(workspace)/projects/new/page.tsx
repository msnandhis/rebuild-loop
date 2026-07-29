import { NewProjectForm } from "../../../../components/projects/new-project-form";

export const metadata = {
  title: "New project",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-[960px] px-5 py-10 md:px-8 md:py-14">
      <div className="border-b border-rule pb-7">
        <p className="font-mono text-xs font-medium tracking-[0.12em] text-action uppercase">
          Site brief / New record
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.035em] md:text-4xl">
          Create a project.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink-muted">
          Start with the minimum site context. Evidence capture and material
          decisions remain separate, traceable stages.
        </p>
      </div>
      <NewProjectForm submissionToken={crypto.randomUUID()} />
    </div>
  );
}
