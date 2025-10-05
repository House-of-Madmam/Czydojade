ALTER TABLE "incidents" ALTER COLUMN "end_time" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "line_direction" text;