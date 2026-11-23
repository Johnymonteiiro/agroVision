CREATE TYPE "public"."readiness" AS ENUM('READY', 'NOT_READY');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(30) NOT NULL,
	"description" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animal_images" ADD COLUMN "readiness_at_capture" "readiness" NOT NULL;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "animals" ADD COLUMN "readiness" "readiness" NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_unique" ON "categories" USING btree (lower(trim("name")));--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "animals_category_id_idx" ON "animals" USING btree ("category_id");--> statement-breakpoint
INSERT INTO "categories" ("id", "name", "description") VALUES ('00000000-0000-4000-8000-000000000001', 'Taurino', 'Sem cupim'), ('00000000-0000-4000-8000-000000000002', 'Zebu', 'Com cupim');