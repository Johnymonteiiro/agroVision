CREATE TYPE "public"."age_unit" AS ENUM('MONTHS', 'YEARS');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('TAURINE', 'ZEBU');--> statement-breakpoint
CREATE TYPE "public"."framing" AS ENUM('FRAMED', 'OUT_OF_FRAME', 'TOO_FAR', 'NOT_DETECTED', 'UNAVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('REAR', 'TOP', 'SIDE');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE "animal_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"animal_id" uuid NOT NULL,
	"position" "position" NOT NULL,
	"framing" "framing" NOT NULL,
	"min_distance_m" numeric(4, 1) NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"bytes" integer NOT NULL,
	"weight_kg_at_capture" integer NOT NULL,
	"age_months_at_capture" integer NOT NULL,
	"object_key" text NOT NULL,
	"thumb_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "animal_images_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "animal_images_thumb_key_unique" UNIQUE("thumb_key")
);
--> statement-breakpoint
CREATE TABLE "animals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"external_id" varchar(20) NOT NULL,
	"category" "category" NOT NULL,
	"sex" "sex" NOT NULL,
	"birth_date_estimated" date NOT NULL,
	"age_input_unit" "age_unit" NOT NULL,
	"weight_kg" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animal_images" ADD CONSTRAINT "animal_images_animal_id_animals_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "animal_images_animal_id_idx" ON "animal_images" USING btree ("animal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "animals_external_id_unique" ON "animals" USING btree (lower(trim("external_id")));