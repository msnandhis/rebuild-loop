CREATE TYPE "public"."analysis_attempt_status" AS ENUM('RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."analysis_kind" AS ENUM('INITIAL', 'CLARIFICATION');--> statement-breakpoint
CREATE TYPE "public"."analysis_phase" AS ENUM('QUEUED', 'PREPARING_EVIDENCE', 'CALLING_MODEL', 'VALIDATING', 'PERSISTING', 'COMPLETE', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."analysis_status" AS ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."candidate_revision_disposition" AS ENUM('PROPOSED', 'REVISED', 'UNCHANGED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."clarification_evidence_type" AS ENUM('CLOSE_UP', 'LABEL', 'MEASUREMENT', 'CONTEXT');--> statement-breakpoint
CREATE TYPE "public"."clarification_task_status" AS ENUM('OPEN', 'SUBMITTED', 'ACCEPTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."evidence_locator_kind" AS ENUM('FULL_IMAGE', 'REGION');--> statement-breakpoint
CREATE TYPE "public"."material_family" AS ENUM('CONCRETE', 'BRICK', 'STEEL', 'TIMBER', 'GLASS', 'ALUMINIUM', 'FIXTURES', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."model_output_validation_status" AS ENUM('VALID', 'SHAPE_INVALID', 'SEMANTIC_INVALID');--> statement-breakpoint
CREATE TYPE "public"."preliminary_pathway" AS ENUM('SAME_SITE_REUSE', 'DIRECT_REUSE', 'RECYCLE', 'SPECIALIST_REVIEW', 'RESIDUAL', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."workflow_job_status" AS ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."media_asset_status" AS ENUM('PENDING_UPLOAD', 'VERIFYING', 'READY', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."upload_session_status" AS ENUM('OPEN', 'SUBMITTED', 'COMPLETED', 'EXPIRED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "analysis_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"queue_job_id" text,
	"status" "analysis_attempt_status" DEFAULT 'RUNNING' NOT NULL,
	"provider_request_id" text,
	"safe_error_code" varchar(80),
	"safe_error_message" varchar(400),
	"latency_ms" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "analysis_attempts_id_run_owner_unique" UNIQUE("id","analysis_run_id","owner_user_id","project_id"),
	CONSTRAINT "analysis_attempts_run_number_unique" UNIQUE("analysis_run_id","attempt_number"),
	CONSTRAINT "analysis_attempts_values" CHECK ("analysis_attempts"."attempt_number" > 0 and ("analysis_attempts"."latency_ms" is null or "analysis_attempts"."latency_ms" >= 0))
);
--> statement-breakpoint
CREATE TABLE "analysis_inputs" (
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"purpose" varchar(80) DEFAULT 'PRIMARY' NOT NULL,
	"sha256_snapshot" varchar(64) NOT NULL,
	"bytes_snapshot" integer NOT NULL,
	"mime_snapshot" varchar(100) NOT NULL,
	"width_snapshot" integer NOT NULL,
	"height_snapshot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_inputs_pk" PRIMARY KEY("analysis_run_id","media_asset_id"),
	CONSTRAINT "analysis_inputs_run_media_owner_unique" UNIQUE("analysis_run_id","media_asset_id","owner_user_id","project_id"),
	CONSTRAINT "analysis_inputs_run_ordinal_unique" UNIQUE("analysis_run_id","ordinal"),
	CONSTRAINT "analysis_inputs_snapshot_values" CHECK ("analysis_inputs"."sha256_snapshot" ~ '^[0-9a-f]{64}$'
        and "analysis_inputs"."bytes_snapshot" > 0
        and "analysis_inputs"."width_snapshot" > 0
        and "analysis_inputs"."height_snapshot" > 0
        and "analysis_inputs"."ordinal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" "analysis_kind" DEFAULT 'INITIAL' NOT NULL,
	"base_run_id" uuid,
	"status" "analysis_status" DEFAULT 'QUEUED' NOT NULL,
	"phase" "analysis_phase" DEFAULT 'QUEUED' NOT NULL,
	"model" varchar(120) NOT NULL,
	"prompt_version" varchar(80) NOT NULL,
	"schema_version" varchar(80) NOT NULL,
	"input_hash" varchar(64) NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"safe_error_code" varchar(80),
	"safe_error_message" varchar(400),
	"retryable" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_runs_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "analysis_runs_owner_project_idempotency_unique" UNIQUE("owner_user_id","project_id","idempotency_key"),
	CONSTRAINT "analysis_runs_hash_formats" CHECK ("analysis_runs"."input_hash" ~ '^[0-9a-f]{64}$' and "analysis_runs"."request_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "candidate_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"candidate_thread_id" uuid NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"model_output_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"previous_revision_id" uuid,
	"disposition" "candidate_revision_disposition" NOT NULL,
	"client_candidate_key" varchar(64) NOT NULL,
	"material_family" "material_family" NOT NULL,
	"subtype" varchar(120),
	"observation_summary" text NOT NULL,
	"condition" jsonb NOT NULL,
	"quantity" jsonb NOT NULL,
	"unknowns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specialist_review_required" boolean DEFAULT false NOT NULL,
	"preliminary_pathway" "preliminary_pathway" NOT NULL,
	"overall_confidence" real NOT NULL,
	"normalized_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_revisions_id_thread_owner_unique" UNIQUE("id","candidate_thread_id","owner_user_id","project_id"),
	CONSTRAINT "candidate_revisions_id_run_owner_unique" UNIQUE("id","analysis_run_id","owner_user_id","project_id"),
	CONSTRAINT "candidate_revisions_thread_number_unique" UNIQUE("candidate_thread_id","revision_number"),
	CONSTRAINT "candidate_revisions_values" CHECK ("candidate_revisions"."revision_number" > 0
        and "candidate_revisions"."overall_confidence" >= 0
        and "candidate_revisions"."overall_confidence" <= 1
      )
);
--> statement-breakpoint
CREATE TABLE "candidate_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"created_from_run_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_threads_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id")
);
--> statement-breakpoint
CREATE TABLE "clarification_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"candidate_thread_id" uuid NOT NULL,
	"source_revision_id" uuid NOT NULL,
	"instruction" varchar(500) NOT NULL,
	"rationale" varchar(500) NOT NULL,
	"required_evidence" "clarification_evidence_type" NOT NULL,
	"status" "clarification_task_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"candidate_revision_id" uuid NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"locator_kind" "evidence_locator_kind" NOT NULL,
	"locator" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"observation" varchar(400) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidence_references_revision_ordinal_unique" UNIQUE("candidate_revision_id","ordinal"),
	CONSTRAINT "evidence_references_ordinal_nonnegative" CHECK ("evidence_references"."ordinal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "model_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"analysis_run_id" uuid NOT NULL,
	"analysis_attempt_id" uuid NOT NULL,
	"provider_envelope" jsonb NOT NULL,
	"extracted_raw_text" text,
	"normalized_output" jsonb,
	"response_hash" varchar(64) NOT NULL,
	"validation_status" "model_output_validation_status" NOT NULL,
	"usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"finish_reason" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_outputs_id_run_owner_unique" UNIQUE("id","analysis_run_id","owner_user_id","project_id"),
	CONSTRAINT "model_outputs_attempt_unique" UNIQUE("analysis_attempt_id"),
	CONSTRAINT "model_outputs_response_hash_format" CHECK ("model_outputs"."response_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "workflow_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task" varchar(80) NOT NULL,
	"payload" jsonb NOT NULL,
	"job_key" varchar(160) NOT NULL,
	"status" "workflow_job_status" DEFAULT 'QUEUED' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"last_error_code" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_jobs_job_key_unique" UNIQUE("job_key"),
	CONSTRAINT "workflow_jobs_attempts_valid" CHECK ("workflow_jobs"."attempts" >= 0 and "workflow_jobs"."max_attempts" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"status" "media_asset_status" DEFAULT 'PENDING_UPLOAD' NOT NULL,
	"final_object_key" text,
	"original_filename" varchar(255) NOT NULL,
	"declared_mime" varchar(100) NOT NULL,
	"detected_mime" varchar(100),
	"expected_bytes" bigint NOT NULL,
	"actual_bytes" bigint,
	"sha256" varchar(64),
	"object_version" text,
	"object_etag" text,
	"width" bigint,
	"height" bigint,
	"rejection_code" varchar(80),
	"ready_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_final_object_key_unique" UNIQUE("final_object_key"),
	CONSTRAINT "media_assets_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "media_assets_expected_bytes_range" CHECK ("media_assets"."expected_bytes" > 0 and "media_assets"."expected_bytes" <= 10485760),
	CONSTRAINT "media_assets_actual_bytes_range" CHECK ("media_assets"."actual_bytes" is null or ("media_assets"."actual_bytes" > 0 and "media_assets"."actual_bytes" <= 10485760)),
	CONSTRAINT "media_assets_dimensions_positive" CHECK (("media_assets"."width" is null and "media_assets"."height" is null) or ("media_assets"."width" > 0 and "media_assets"."height" > 0)),
	CONSTRAINT "media_assets_ready_fields" CHECK ("media_assets"."status" <> 'READY' or (
        "media_assets"."final_object_key" is not null
        and "media_assets"."detected_mime" is not null
        and "media_assets"."actual_bytes" is not null
        and "media_assets"."sha256" is not null
        and "media_assets"."width" is not null
        and "media_assets"."height" is not null
        and "media_assets"."ready_at" is not null
      ))
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"incoming_object_key" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"status" "upload_session_status" DEFAULT 'OPEN' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "upload_sessions_incoming_object_key_unique" UNIQUE("incoming_object_key"),
	CONSTRAINT "upload_sessions_id_project_owner_unique" UNIQUE("id","project_id","owner_user_id"),
	CONSTRAINT "upload_sessions_owner_project_idempotency_unique" UNIQUE("owner_user_id","project_id","idempotency_key"),
	CONSTRAINT "upload_sessions_request_hash_format" CHECK ("upload_sessions"."request_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "analysis_attempts" ADD CONSTRAINT "analysis_attempts_run_owner_fk" FOREIGN KEY ("analysis_run_id","project_id","owner_user_id") REFERENCES "public"."analysis_runs"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_inputs" ADD CONSTRAINT "analysis_inputs_run_owner_fk" FOREIGN KEY ("analysis_run_id","project_id","owner_user_id") REFERENCES "public"."analysis_runs"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_inputs" ADD CONSTRAINT "analysis_inputs_media_owner_fk" FOREIGN KEY ("media_asset_id","project_id","owner_user_id") REFERENCES "public"."media_assets"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_project_owner_fk" FOREIGN KEY ("project_id","owner_user_id") REFERENCES "public"."projects"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_base_run_owner_fk" FOREIGN KEY ("base_run_id","project_id","owner_user_id") REFERENCES "public"."analysis_runs"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_revisions" ADD CONSTRAINT "candidate_revisions_thread_owner_fk" FOREIGN KEY ("candidate_thread_id","project_id","owner_user_id") REFERENCES "public"."candidate_threads"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_revisions" ADD CONSTRAINT "candidate_revisions_output_owner_fk" FOREIGN KEY ("model_output_id","analysis_run_id","owner_user_id","project_id") REFERENCES "public"."model_outputs"("id","analysis_run_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_revisions" ADD CONSTRAINT "candidate_revisions_previous_owner_fk" FOREIGN KEY ("previous_revision_id","candidate_thread_id","owner_user_id","project_id") REFERENCES "public"."candidate_revisions"("id","candidate_thread_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_threads" ADD CONSTRAINT "candidate_threads_run_owner_fk" FOREIGN KEY ("created_from_run_id","project_id","owner_user_id") REFERENCES "public"."analysis_runs"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarification_tasks" ADD CONSTRAINT "clarification_tasks_revision_thread_owner_fk" FOREIGN KEY ("source_revision_id","candidate_thread_id","owner_user_id","project_id") REFERENCES "public"."candidate_revisions"("id","candidate_thread_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_references" ADD CONSTRAINT "evidence_references_revision_run_owner_fk" FOREIGN KEY ("candidate_revision_id","analysis_run_id","owner_user_id","project_id") REFERENCES "public"."candidate_revisions"("id","analysis_run_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_references" ADD CONSTRAINT "evidence_references_input_owner_fk" FOREIGN KEY ("analysis_run_id","media_asset_id","owner_user_id","project_id") REFERENCES "public"."analysis_inputs"("analysis_run_id","media_asset_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_outputs" ADD CONSTRAINT "model_outputs_attempt_owner_fk" FOREIGN KEY ("analysis_attempt_id","analysis_run_id","owner_user_id","project_id") REFERENCES "public"."analysis_attempts"("id","analysis_run_id","owner_user_id","project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_project_owner_fk" FOREIGN KEY ("project_id","owner_user_id") REFERENCES "public"."projects"("id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_media_owner_fk" FOREIGN KEY ("media_asset_id","project_id","owner_user_id") REFERENCES "public"."media_assets"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_runs_one_active_per_project" ON "analysis_runs" USING btree ("owner_user_id","project_id") WHERE "analysis_runs"."status" in ('QUEUED', 'RUNNING');--> statement-breakpoint
CREATE INDEX "analysis_runs_project_created_idx" ON "analysis_runs" USING btree ("owner_user_id","project_id","created_at");--> statement-breakpoint
CREATE INDEX "analysis_runs_input_hash_idx" ON "analysis_runs" USING btree ("owner_user_id","project_id","input_hash");--> statement-breakpoint
CREATE INDEX "candidate_revisions_current_lookup_idx" ON "candidate_revisions" USING btree ("candidate_thread_id","revision_number");--> statement-breakpoint
CREATE INDEX "candidate_threads_project_created_idx" ON "candidate_threads" USING btree ("owner_user_id","project_id","created_at");--> statement-breakpoint
CREATE INDEX "clarification_tasks_project_status_idx" ON "clarification_tasks" USING btree ("owner_user_id","project_id","status","created_at");--> statement-breakpoint
CREATE INDEX "evidence_references_media_idx" ON "evidence_references" USING btree ("owner_user_id","project_id","media_asset_id");--> statement-breakpoint
CREATE INDEX "workflow_jobs_claim_idx" ON "workflow_jobs" USING btree ("status","run_at","created_at");--> statement-breakpoint
CREATE INDEX "media_assets_project_status_idx" ON "media_assets" USING btree ("owner_user_id","project_id","status","created_at");--> statement-breakpoint
CREATE INDEX "upload_sessions_expiry_status_idx" ON "upload_sessions" USING btree ("status","expires_at");--> statement-breakpoint
CREATE FUNCTION "prevent_evidence_history_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "analysis_inputs_append_only"
BEFORE UPDATE OR DELETE ON "analysis_inputs"
FOR EACH ROW EXECUTE FUNCTION "prevent_evidence_history_mutation"();--> statement-breakpoint
CREATE TRIGGER "model_outputs_append_only"
BEFORE UPDATE OR DELETE ON "model_outputs"
FOR EACH ROW EXECUTE FUNCTION "prevent_evidence_history_mutation"();--> statement-breakpoint
CREATE TRIGGER "candidate_revisions_append_only"
BEFORE UPDATE OR DELETE ON "candidate_revisions"
FOR EACH ROW EXECUTE FUNCTION "prevent_evidence_history_mutation"();--> statement-breakpoint
CREATE TRIGGER "evidence_references_append_only"
BEFORE UPDATE OR DELETE ON "evidence_references"
FOR EACH ROW EXECUTE FUNCTION "prevent_evidence_history_mutation"();--> statement-breakpoint
CREATE FUNCTION "protect_ready_media_identity"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'READY' AND (
    NEW.final_object_key IS DISTINCT FROM OLD.final_object_key OR
    NEW.detected_mime IS DISTINCT FROM OLD.detected_mime OR
    NEW.actual_bytes IS DISTINCT FROM OLD.actual_bytes OR
    NEW.sha256 IS DISTINCT FROM OLD.sha256 OR
    NEW.width IS DISTINCT FROM OLD.width OR
    NEW.height IS DISTINCT FROM OLD.height OR
    NEW.ready_at IS DISTINCT FROM OLD.ready_at
  ) THEN
    RAISE EXCEPTION 'ready media identity is immutable';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "media_assets_ready_identity_immutable"
BEFORE UPDATE ON "media_assets"
FOR EACH ROW EXECUTE FUNCTION "protect_ready_media_identity"();--> statement-breakpoint
CREATE FUNCTION "require_ready_analysis_input"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM media_assets media
    WHERE media.id = NEW.media_asset_id
      AND media.project_id = NEW.project_id
      AND media.owner_user_id = NEW.owner_user_id
      AND media.status = 'READY'
      AND media.sha256 = NEW.sha256_snapshot
  ) THEN
    RAISE EXCEPTION 'analysis input must snapshot ready owned media';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "analysis_inputs_require_ready_media"
BEFORE INSERT ON "analysis_inputs"
FOR EACH ROW EXECUTE FUNCTION "require_ready_analysis_input"();--> statement-breakpoint
ALTER TABLE "evidence_references" ADD CONSTRAINT "evidence_references_locator_valid"
CHECK (
  "locator_kind" = 'FULL_IMAGE' OR (
    "locator" ?& ARRAY['x', 'y', 'width', 'height']
    AND ("locator"->>'x')::numeric >= 0
    AND ("locator"->>'y')::numeric >= 0
    AND ("locator"->>'width')::numeric > 0
    AND ("locator"->>'height')::numeric > 0
    AND ("locator"->>'x')::numeric + ("locator"->>'width')::numeric <= 1
    AND ("locator"->>'y')::numeric + ("locator"->>'height')::numeric <= 1
  )
);
