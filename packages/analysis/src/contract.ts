import { z } from "zod";

export const PROMPT_VERSION = "evidence-analyst-v1";
export const SCHEMA_VERSION = "candidate-proposals-v1";

export const materialFamilySchema = z.enum([
  "CONCRETE",
  "BRICK",
  "STEEL",
  "TIMBER",
  "GLASS",
  "ALUMINIUM",
  "FIXTURES",
  "OTHER",
]);

export const evidenceReferenceSchema = z.object({
  assetId: z.uuid(),
  observation: z.string().trim().min(1).max(500),
  region: z
    .object({
      height: z.number().gt(0).lte(1),
      width: z.number().gt(0).lte(1),
      x: z.number().gte(0).lt(1),
      y: z.number().gte(0).lt(1),
    })
    .refine(
      (region) => region.x + region.width <= 1 && region.y + region.height <= 1,
      "Evidence region must remain inside the image",
    )
    .optional(),
});

export const candidateProposalSchema = z.object({
  candidateKey: z.string().trim().min(1).max(64),
  condition: z.enum(["GOOD", "FAIR", "POOR", "DAMAGED", "UNKNOWN"]),
  conditionConfidence: z.number().gte(0).lte(1),
  evidence: z.array(evidenceReferenceSchema).min(1).max(12),
  materialFamily: materialFamilySchema,
  observationSummary: z.string().trim().min(1).max(800),
  overallConfidence: z.number().gte(0).lte(1),
  preliminaryPathway: z.enum([
    "SAME_SITE_REUSE",
    "DIRECT_REUSE",
    "RECYCLE",
    "SPECIALIST_REVIEW",
    "RESIDUAL",
    "UNKNOWN",
  ]),
  quantity: z.object({
    basis: z.string().trim().min(1).max(240),
    confidence: z.number().gte(0).lte(1),
    maximum: z.number().nonnegative(),
    minimum: z.number().nonnegative(),
    unit: z.enum(["ITEM", "M2", "M3", "M", "KG", "TONNE", "UNKNOWN"]),
  }),
  riskFlags: z
    .array(
      z.enum([
        "NONE",
        "FIRE_RATING_UNKNOWN",
        "HAZARDOUS_MATERIAL_POSSIBLE",
        "STRUCTURAL_ROLE_POSSIBLE",
        "CONDITION_UNCERTAIN",
        "SPECIALIST_INSPECTION_REQUIRED",
      ]),
    )
    .max(6),
  specialistReviewRequired: z.boolean(),
  subtype: z.string().trim().min(1).max(160),
  unknowns: z.array(z.string().trim().min(1).max(300)).max(10),
});

export const analysisOutputSchema = z.object({
  candidates: z.array(candidateProposalSchema).max(20),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
export type CandidateProposal = z.infer<typeof candidateProposalSchema>;

export function validateAnalysisOutput(
  value: unknown,
  allowedAssetIds: ReadonlySet<string>,
): AnalysisOutput {
  const output = analysisOutputSchema.parse(value);

  for (const candidate of output.candidates) {
    if (
      candidate.riskFlags.includes("NONE") &&
      candidate.riskFlags.length > 1
    ) {
      throw new Error("NONE cannot be combined with another risk flag");
    }

    if (candidate.quantity.minimum > candidate.quantity.maximum) {
      throw new Error("Quantity minimum cannot exceed maximum");
    }

    for (const reference of candidate.evidence) {
      if (!allowedAssetIds.has(reference.assetId)) {
        throw new Error(
          `Candidate cited evidence outside the analysis manifest: ${reference.assetId}`,
        );
      }
    }
  }

  return output;
}
