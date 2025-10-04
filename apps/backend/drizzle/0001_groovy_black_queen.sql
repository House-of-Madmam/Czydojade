CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
ALTER TABLE "incidents" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."incident_type";--> statement-breakpoint
CREATE TYPE "public"."incident_type" AS ENUM('vehicleBreakdown', 'infrastructureBreakdown', 'dangerInsideVehicle');--> statement-breakpoint
ALTER TABLE "incidents" ALTER COLUMN "type" SET DATA TYPE "public"."incident_type" USING "type"::"public"."incident_type";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";