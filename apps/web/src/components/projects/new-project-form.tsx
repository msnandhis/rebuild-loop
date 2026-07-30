"use client";

import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import {
  createProjectAction,
  type ProjectFormState,
} from "../../app/(workspace)/projects/new/actions";

const initialState: ProjectFormState = {};

export function NewProjectForm({
  submissionToken,
}: {
  submissionToken: string;
}) {
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="border border-rule bg-paper px-5 py-6 md:px-6"
    >
      <input name="submissionToken" type="hidden" value={submissionToken} />
      {state.error && (
        <div
          className="mb-6 border-l-4 border-blocked bg-blocked-wash px-4 py-3 text-sm leading-6 text-blocked"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <fieldset className="border-0 p-0">
        <legend className="w-full border-b border-rule pb-2 text-sm font-semibold">
          Project
        </legend>
        <div className="space-y-5 py-5">
          <ProjectField
            autoComplete="off"
            defaultValue={state.values?.name}
            error={state.fieldErrors?.name?.[0]}
            label="Project name"
            maxLength={120}
            name="name"
            placeholder="e.g. North workshop strip-out"
            required
          />
        </div>
      </fieldset>

      <fieldset className="border-0 p-0">
        <legend className="w-full border-b border-rule pb-2 text-sm font-semibold">
          Site
        </legend>
        <div className="space-y-5 py-5">
          <ProjectField
            autoComplete="organization"
            defaultValue={state.values?.siteName}
            error={state.fieldErrors?.siteName?.[0]}
            label="Building or site"
            maxLength={120}
            name="siteName"
            placeholder="e.g. North workshop"
            required
          />
          <ProjectField
            autoComplete="address-level2"
            defaultValue={state.values?.locationText}
            error={state.fieldErrors?.locationText?.[0]}
            label="Location"
            maxLength={240}
            name="locationText"
            placeholder="e.g. Pune, Maharashtra"
            required
          />
          <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)] md:gap-6">
            <label
              className="pt-3 text-sm font-semibold text-ink"
              htmlFor="project-type"
            >
              Project type <span className="text-action">*</span>
            </label>
            <div>
              <select
                aria-describedby={
                  state.fieldErrors?.type?.[0]
                    ? "project-type-error"
                    : undefined
                }
                aria-invalid={Boolean(state.fieldErrors?.type?.[0])}
                className="min-h-12 w-full rounded-md border border-rule-strong bg-paper px-3 text-base text-ink outline-none transition-colors focus:border-action focus:ring-2 focus:ring-focus/25"
                defaultValue={state.values?.type ?? ""}
                id="project-type"
                name="type"
                required
              >
                <option disabled value="">
                  Choose one
                </option>
                <option value="RENOVATION">
                  Renovation / interior strip-out
                </option>
                <option value="DEMOLITION">Demolition</option>
                <option value="MIXED">Mixed renovation and demolition</option>
              </select>
              {state.fieldErrors?.type?.[0] && (
                <p
                  className="mt-1.5 text-xs leading-5 text-blocked"
                  id="project-type-error"
                >
                  {state.fieldErrors.type[0]}
                </p>
              )}
            </div>
          </div>
          <ProjectField
            autoComplete="off"
            defaultValue={state.values?.plannedWorkDate}
            error={state.fieldErrors?.plannedWorkDate?.[0]}
            label="Planned work date"
            name="plannedWorkDate"
            type="date"
          />
        </div>
      </fieldset>

      <details
        className="border-t border-rule py-4"
        open={Boolean(state.fieldErrors?.scaleNote?.[0])}
      >
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          Additional details
        </summary>
        <div className="pt-5">
          <ProjectField
            autoComplete="off"
            defaultValue={state.values?.scaleNote}
            error={state.fieldErrors?.scaleNote?.[0]}
            help="Optional floor area, storeys, or scope note. Do not estimate if unknown."
            label="Scale or scope"
            maxLength={240}
            name="scaleNote"
            placeholder="e.g. 1,200 m² office floor, interior elements only"
          />
        </div>
      </details>

      <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-paper-subtle hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          href="/projects"
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Back to projects
        </Link>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-action bg-action px-5 text-[13px] font-semibold text-white transition-colors hover:border-ink hover:bg-ink disabled:cursor-wait disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={17}
            />
          ) : (
            <ArrowRight aria-hidden="true" size={17} strokeWidth={1.75} />
          )}
          {pending ? "Creating…" : "Create project"}
        </button>
      </div>
    </form>
  );
}

interface ProjectFieldProps {
  autoComplete: string;
  defaultValue?: string | undefined;
  error?: string | undefined;
  help?: string;
  label: string;
  maxLength?: number;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: "date" | "text";
}

function ProjectField({
  autoComplete,
  defaultValue,
  error,
  help,
  label,
  maxLength,
  name,
  placeholder,
  required = false,
  type = "text",
}: ProjectFieldProps) {
  const id = `project-${name}`;
  const describedBy = [help ? `${id}-help` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)] md:gap-6">
      <label className="pt-3 text-sm font-semibold text-ink" htmlFor={id}>
        {label} {required && <span className="text-action">*</span>}
      </label>
      <div>
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className="min-h-12 w-full rounded-md border border-rule-strong bg-paper px-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/55 focus:border-action focus:ring-2 focus:ring-focus/25"
          defaultValue={defaultValue}
          id={id}
          maxLength={maxLength}
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
        {help && (
          <p
            className="mt-1.5 text-xs leading-5 text-ink-muted"
            id={`${id}-help`}
          >
            {help}
          </p>
        )}
        {error && (
          <p
            className="mt-1.5 text-xs leading-5 text-blocked"
            id={`${id}-error`}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
