CREATE TYPE "public"."job_run_status" AS ENUM('RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."inventory_item_status" AS ENUM('CONFIRMED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."recovery_pathway" AS ENUM('SAME_SITE_REUSE', 'DIRECT_REUSE', 'RECYCLE', 'SPECIALIST_REVIEW', 'RESIDUAL');--> statement-breakpoint
CREATE TYPE "public"."recovery_plan_status" AS ENUM('DRAFT', 'APPROVED', 'SUPERSEDED');--> statement-breakpoint
CREATE TYPE "public"."review_decision_action" AS ENUM('CONFIRMED', 'CORRECTED', 'REJECTED', 'EVIDENCE_REQUESTED', 'SPECIALIST_REVIEW');--> statement-breakpoint
CREATE TABLE "clarification_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"clarification_task_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"submitted_by_user_id" text NOT NULL,
	"note" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clarification_submissions_task_media_unique" UNIQUE("clarification_task_id","media_asset_id"),
	CONSTRAINT "clarification_submissions_actor_owner" CHECK ("clarification_submissions"."submitted_by_user_id" = "clarification_submissions"."owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "api_idempotency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"route" varchar(240) NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"response_status" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "api_idempotency_owner_route_key_unique" UNIQUE("owner_user_id","route","idempotency_key"),
	CONSTRAINT "api_idempotency_values" CHECK ("api_idempotency"."request_hash" ~ '^[0-9a-f]{64}$'
        and ("api_idempotency"."response_status" is null or "api_idempotency"."response_status" between 100 and 599)
        and (
          ("api_idempotency"."completed_at" is null and "api_idempotency"."response_status" is null)
          or ("api_idempotency"."completed_at" is not null and "api_idempotency"."response_status" is not null and "api_idempotency"."response_body" is not null)
        ))
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"workflow_job_id" uuid NOT NULL,
	"analysis_run_id" uuid,
	"attempt_number" integer NOT NULL,
	"status" "job_run_status" DEFAULT 'RUNNING' NOT NULL,
	"correlation_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"safe_error_code" varchar(80),
	"safe_error_message" varchar(400),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "job_runs_job_attempt_unique" UNIQUE("workflow_job_id","attempt_number"),
	CONSTRAINT "job_runs_attempt_positive" CHECK ("job_runs"."attempt_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_item_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"source_candidate_revision_id" uuid NOT NULL,
	"source_decision_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"material_family" varchar(80) NOT NULL,
	"subtype" varchar(120),
	"condition" jsonb NOT NULL,
	"quantity" jsonb NOT NULL,
	"safety_facts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specialist_review_required" boolean DEFAULT false NOT NULL,
	"human_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_revisions_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "inventory_revisions_item_number_unique" UNIQUE("inventory_item_id","revision_number"),
	CONSTRAINT "inventory_revisions_source_decision_unique" UNIQUE("source_decision_id"),
	CONSTRAINT "inventory_revisions_number_positive" CHECK ("inventory_item_revisions"."revision_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"candidate_thread_id" uuid NOT NULL,
	"status" "inventory_item_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "inventory_items_thread_unique" UNIQUE("candidate_thread_id")
);
--> statement-breakpoint
CREATE TABLE "pathway_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"inventory_item_revision_id" uuid NOT NULL,
	"rule_version_id" uuid NOT NULL,
	"input_hash" varchar(64) NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"fired_rule_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failed_gates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passed_gates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_pathway" "recovery_pathway" NOT NULL,
	"alternative_pathway" "recovery_pathway",
	"direct_reuse_blocked" boolean NOT NULL,
	"explanation" varchar(1200) NOT NULL,
	"preparation_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pathway_assessments_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "pathway_assessments_input_rule_unique" UNIQUE("inventory_item_revision_id","rule_version_id","input_hash"),
	CONSTRAINT "pathway_assessments_input_hash_format" CHECK ("pathway_assessments"."input_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "pathway_assessments_direct_reuse_gate" CHECK (not ("pathway_assessments"."preferred_pathway" in ('DIRECT_REUSE', 'SAME_SITE_REUSE') and "pathway_assessments"."direct_reuse_blocked"))
);
--> statement-breakpoint
CREATE TABLE "recovery_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"recovery_plan_id" uuid NOT NULL,
	"inventory_item_revision_id" uuid NOT NULL,
	"pathway_assessment_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"removal_instructions" varchar(1600) NOT NULL,
	"risks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_plan_items_plan_sequence_unique" UNIQUE("recovery_plan_id","sequence"),
	CONSTRAINT "recovery_plan_items_plan_inventory_unique" UNIQUE("recovery_plan_id","inventory_item_revision_id"),
	CONSTRAINT "recovery_plan_items_sequence_positive" CHECK ("recovery_plan_items"."sequence" > 0)
);
--> statement-breakpoint
CREATE TABLE "recovery_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"source_hash" varchar(64) NOT NULL,
	"status" "recovery_plan_status" DEFAULT 'DRAFT' NOT NULL,
	"approved_by_user_id" text,
	"approved_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_plans_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "recovery_plans_project_revision_unique" UNIQUE("project_id","revision_number"),
	CONSTRAINT "recovery_plans_project_source_hash_unique" UNIQUE("project_id","source_hash"),
	CONSTRAINT "recovery_plans_values" CHECK ("recovery_plans"."revision_number" > 0
        and "recovery_plans"."source_hash" ~ '^[0-9a-f]{64}$'
        and (
          ("recovery_plans"."status" = 'APPROVED' and "recovery_plans"."approved_by_user_id" = "recovery_plans"."owner_user_id" and "recovery_plans"."approved_at" is not null)
          or ("recovery_plans"."status" <> 'APPROVED')
        ))
);
--> statement-breakpoint
CREATE TABLE "recovery_rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar(80) NOT NULL,
	"description" varchar(500) NOT NULL,
	"rules" jsonb NOT NULL,
	"rules_hash" varchar(64) NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_rule_versions_version_unique" UNIQUE("version"),
	CONSTRAINT "recovery_rule_versions_rules_hash_unique" UNIQUE("rules_hash")
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"candidate_thread_id" uuid NOT NULL,
	"candidate_revision_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"action" "review_decision_action" NOT NULL,
	"reason" varchar(1000),
	"edited_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_decisions_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "review_decisions_owner_project_idempotency_unique" UNIQUE("owner_user_id","project_id","idempotency_key"),
	CONSTRAINT "review_decisions_actor_owner" CHECK ("review_decisions"."actor_user_id" = "review_decisions"."owner_user_id"),
	CONSTRAINT "review_decisions_request_hash_format" CHECK ("review_decisions"."request_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "clarification_tasks" ADD COLUMN "resolving_revision_id" uuid;--> statement-breakpoint
ALTER TABLE "clarification_tasks" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "candidate_revisions" ADD CONSTRAINT "candidate_revisions_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id");--> statement-breakpoint
ALTER TABLE "clarification_tasks" ADD CONSTRAINT "clarification_tasks_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id");--> statement-breakpoint
ALTER TABLE "clarification_submissions" ADD CONSTRAINT "clarification_submissions_task_owner_fk" FOREIGN KEY ("clarification_task_id","project_id","owner_user_id") REFERENCES "public"."clarification_tasks"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarification_submissions" ADD CONSTRAINT "clarification_submissions_media_owner_fk" FOREIGN KEY ("media_asset_id","project_id","owner_user_id") REFERENCES "public"."media_assets"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_project_owner_fk" FOREIGN KEY ("project_id","owner_user_id") REFERENCES "public"."projects"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_workflow_job_fk" FOREIGN KEY ("workflow_job_id") REFERENCES "public"."workflow_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_runs" ADD CONSTRAINT "job_runs_analysis_owner_fk" FOREIGN KEY ("analysis_run_id","project_id","owner_user_id") REFERENCES "public"."analysis_runs"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_revisions" ADD CONSTRAINT "inventory_revisions_item_owner_fk" FOREIGN KEY ("inventory_item_id","project_id","owner_user_id") REFERENCES "public"."inventory_items"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_revisions" ADD CONSTRAINT "inventory_revisions_candidate_owner_fk" FOREIGN KEY ("source_candidate_revision_id","project_id","owner_user_id") REFERENCES "public"."candidate_revisions"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_item_revisions" ADD CONSTRAINT "inventory_revisions_decision_owner_fk" FOREIGN KEY ("source_decision_id","project_id","owner_user_id") REFERENCES "public"."review_decisions"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_thread_owner_fk" FOREIGN KEY ("candidate_thread_id","project_id","owner_user_id") REFERENCES "public"."candidate_threads"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathway_assessments" ADD CONSTRAINT "pathway_assessments_inventory_revision_owner_fk" FOREIGN KEY ("inventory_item_revision_id","project_id","owner_user_id") REFERENCES "public"."inventory_item_revisions"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pathway_assessments" ADD CONSTRAINT "pathway_assessments_rule_version_fk" FOREIGN KEY ("rule_version_id") REFERENCES "public"."recovery_rule_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_plan_items" ADD CONSTRAINT "recovery_plan_items_plan_owner_fk" FOREIGN KEY ("recovery_plan_id","project_id","owner_user_id") REFERENCES "public"."recovery_plans"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_plan_items" ADD CONSTRAINT "recovery_plan_items_inventory_revision_owner_fk" FOREIGN KEY ("inventory_item_revision_id","project_id","owner_user_id") REFERENCES "public"."inventory_item_revisions"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_plan_items" ADD CONSTRAINT "recovery_plan_items_assessment_owner_fk" FOREIGN KEY ("pathway_assessment_id","project_id","owner_user_id") REFERENCES "public"."pathway_assessments"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_plans" ADD CONSTRAINT "recovery_plans_project_owner_fk" FOREIGN KEY ("project_id","owner_user_id") REFERENCES "public"."projects"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_revision_thread_owner_fk" FOREIGN KEY ("candidate_revision_id","candidate_thread_id","owner_user_id","project_id") REFERENCES "public"."candidate_revisions"("id","candidate_thread_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clarification_submissions_task_created_idx" ON "clarification_submissions" USING btree ("owner_user_id","project_id","clarification_task_id","created_at");--> statement-breakpoint
CREATE INDEX "job_runs_project_started_idx" ON "job_runs" USING btree ("owner_user_id","project_id","started_at");--> statement-breakpoint
CREATE INDEX "inventory_revisions_item_created_idx" ON "inventory_item_revisions" USING btree ("owner_user_id","project_id","inventory_item_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_items_project_status_idx" ON "inventory_items" USING btree ("owner_user_id","project_id","status","created_at");--> statement-breakpoint
CREATE INDEX "pathway_assessments_project_created_idx" ON "pathway_assessments" USING btree ("owner_user_id","project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_plans_one_approved_project" ON "recovery_plans" USING btree ("project_id") WHERE "recovery_plans"."status" = 'APPROVED';--> statement-breakpoint
CREATE INDEX "recovery_plans_project_status_idx" ON "recovery_plans" USING btree ("owner_user_id","project_id","status","created_at");--> statement-breakpoint
CREATE INDEX "review_decisions_thread_created_idx" ON "review_decisions" USING btree ("owner_user_id","project_id","candidate_thread_id","created_at");--> statement-breakpoint
ALTER TABLE "clarification_tasks" ADD CONSTRAINT "clarification_tasks_resolving_revision_thread_owner_fk" FOREIGN KEY ("resolving_revision_id","candidate_thread_id","owner_user_id","project_id") REFERENCES "public"."candidate_revisions"("id","candidate_thread_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE FUNCTION "prevent_workflow_history_mutation"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "review_decisions_append_only"
BEFORE UPDATE OR DELETE ON "review_decisions"
FOR EACH ROW EXECUTE FUNCTION "prevent_workflow_history_mutation"();
--> statement-breakpoint
CREATE TRIGGER "clarification_submissions_append_only"
BEFORE UPDATE OR DELETE ON "clarification_submissions"
FOR EACH ROW EXECUTE FUNCTION "prevent_workflow_history_mutation"();
--> statement-breakpoint
CREATE TRIGGER "inventory_item_revisions_append_only"
BEFORE UPDATE OR DELETE ON "inventory_item_revisions"
FOR EACH ROW EXECUTE FUNCTION "prevent_workflow_history_mutation"();
--> statement-breakpoint
CREATE TRIGGER "pathway_assessments_append_only"
BEFORE UPDATE OR DELETE ON "pathway_assessments"
FOR EACH ROW EXECUTE FUNCTION "prevent_workflow_history_mutation"();
--> statement-breakpoint
CREATE TRIGGER "recovery_rule_versions_append_only"
BEFORE UPDATE OR DELETE ON "recovery_rule_versions"
FOR EACH ROW EXECUTE FUNCTION "prevent_workflow_history_mutation"();
--> statement-breakpoint
CREATE TRIGGER "recovery_plan_items_append_only"
BEFORE UPDATE OR DELETE ON "recovery_plan_items"
FOR EACH ROW EXECUTE FUNCTION "prevent_workflow_history_mutation"();
