ALTER TABLE "inventory_item_revisions" DROP CONSTRAINT "inventory_revisions_candidate_owner_fk";
--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD COLUMN "clarification_task_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_item_revisions" ADD CONSTRAINT "inventory_revisions_candidate_owner_fk" FOREIGN KEY ("source_candidate_revision_id","project_id","owner_user_id") REFERENCES "public"."candidate_revisions"("id","project_id","owner_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analysis_runs_clarification_task_idx" ON "analysis_runs" USING btree ("owner_user_id","project_id","clarification_task_id") WHERE "analysis_runs"."clarification_task_id" is not null;
