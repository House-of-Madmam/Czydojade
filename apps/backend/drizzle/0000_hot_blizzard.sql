CREATE TYPE "public"."incident_type" AS ENUM('breakdown', 'danger');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."stop_type" AS ENUM('bus', 'tram');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('bus', 'tram');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('confirm', 'reject');--> statement-breakpoint
CREATE TABLE "area_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"radius_meters" integer NOT NULL,
	"min_priority" "priority" DEFAULT 'low' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklisted_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text,
	"type" "incident_type" NOT NULL,
	"priority" "priority" NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"line_id" uuid,
	"stop_id" uuid,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_id" uuid NOT NULL,
	"stop_id" uuid NOT NULL,
	"sequence" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "line_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"line_id" uuid NOT NULL,
	"min_priority" "priority" DEFAULT 'low' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(50) NOT NULL,
	"type" "vehicle_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"type" "stop_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(10) DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"incident_id" uuid NOT NULL,
	"vote_type" "vote_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "area_subscriptions" ADD CONSTRAINT "area_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklisted_tokens" ADD CONSTRAINT "blacklisted_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_line_id_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_stops" ADD CONSTRAINT "line_stops_line_id_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_stops" ADD CONSTRAINT "line_stops_stop_id_stops_id_fk" FOREIGN KEY ("stop_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_subscriptions" ADD CONSTRAINT "line_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_subscriptions" ADD CONSTRAINT "line_subscriptions_line_id_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "area_subscriptions_user_id_idx" ON "area_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "area_subscriptions_lat_lon_idx" ON "area_subscriptions" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "incidents_line_id_idx" ON "incidents" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "incidents_stop_id_idx" ON "incidents" USING btree ("stop_id");--> statement-breakpoint
CREATE INDEX "incidents_active_idx" ON "incidents" USING btree ("end_time");--> statement-breakpoint
CREATE INDEX "incidents_created_at_idx" ON "incidents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "line_stops_line_id_idx" ON "line_stops" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "line_stops_stop_id_idx" ON "line_stops" USING btree ("stop_id");--> statement-breakpoint
CREATE INDEX "line_subscriptions_user_id_idx" ON "line_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "line_subscriptions_line_id_idx" ON "line_subscriptions" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "lines_number_type_idx" ON "lines" USING btree ("number","type");--> statement-breakpoint
CREATE INDEX "stops_lat_lon_idx" ON "stops" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "stops_name_idx" ON "stops" USING btree ("name");--> statement-breakpoint
CREATE INDEX "votes_user_incident_idx" ON "votes" USING btree ("user_id","incident_id");--> statement-breakpoint
CREATE INDEX "votes_incident_id_idx" ON "votes" USING btree ("incident_id");