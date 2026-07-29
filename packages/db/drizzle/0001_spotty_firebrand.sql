ALTER TABLE "projects" ADD COLUMN "submission_token" uuid;--> statement-breakpoint
UPDATE "projects" SET "submission_token" = gen_random_uuid() WHERE "submission_token" IS NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "submission_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_submission_unique" UNIQUE("owner_user_id","submission_token");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_name_length" CHECK (char_length(btrim("user"."name")) between 2 and 120);--> statement-breakpoint
CREATE FUNCTION "prevent_audit_event_mutation"() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$;--> statement-breakpoint
CREATE TRIGGER "audit_events_append_only"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION "prevent_audit_event_mutation"();
