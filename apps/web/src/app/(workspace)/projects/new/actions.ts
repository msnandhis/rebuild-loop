"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createProject } from "../../../../lib/projects";
import { requireSession } from "../../../../lib/session";

const projectSchema = z.object({
  locationText: z
    .string()
    .trim()
    .min(2, "Enter the city or area.")
    .max(240, "Keep the location under 240 characters."),
  name: z
    .string()
    .trim()
    .min(2, "Enter a project name.")
    .max(120, "Keep the project name under 120 characters."),
  plannedWorkDate: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Enter a valid planned work date.",
    ),
  scaleNote: z
    .string()
    .trim()
    .max(240, "Keep the scale note under 240 characters."),
  siteName: z
    .string()
    .trim()
    .min(2, "Enter the building or site name.")
    .max(120, "Keep the site name under 120 characters."),
  submissionToken: z.uuid(),
  type: z.enum(["RENOVATION", "DEMOLITION", "MIXED"], {
    error: "Choose the planned project type.",
  }),
});

export interface ProjectFormState {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof projectSchema>, string[]>>;
  values?: Partial<z.infer<typeof projectSchema>>;
}

export async function createProjectAction(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await requireSession();
  const result = projectSchema.safeParse({
    locationText: formData.get("locationText"),
    name: formData.get("name"),
    plannedWorkDate: formData.get("plannedWorkDate"),
    scaleNote: formData.get("scaleNote"),
    siteName: formData.get("siteName"),
    submissionToken: formData.get("submissionToken"),
    type: formData.get("type"),
  });

  if (!result.success) {
    return {
      error: "Review the highlighted project details.",
      fieldErrors: result.error.flatten().fieldErrors,
      values: {
        locationText: String(formData.get("locationText") ?? ""),
        name: String(formData.get("name") ?? ""),
        plannedWorkDate: String(formData.get("plannedWorkDate") ?? ""),
        scaleNote: String(formData.get("scaleNote") ?? ""),
        siteName: String(formData.get("siteName") ?? ""),
        submissionToken: String(formData.get("submissionToken") ?? ""),
        type: String(formData.get("type") ?? "") as
          "DEMOLITION" | "MIXED" | "RENOVATION",
      },
    };
  }

  let projectId: string;

  try {
    const project = await createProject({
      ...result.data,
      ownerUserId: session.user.id,
    });
    projectId = project.id;
  } catch {
    return {
      error:
        "The project could not be saved. Your entries remain in the form; try again.",
      values: result.data,
    };
  }

  redirect(`/projects/${projectId}/capture`);
}
