import { Readable } from "node:stream";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { animalImages } from "@/lib/db/schema";
import { getObjectStore } from "@/lib/storage/object-store";

export async function GET(request: Request, ctx: RouteContext<"/api/images/[id]">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "not_found" }, { status: 404 });

  const [image] = await getDb().select().from(animalImages).where(eq(animalImages.id, id));
  if (!image) return Response.json({ error: "not_found" }, { status: 404 });

  const thumb = new URL(request.url).searchParams.get("variant") === "thumb";
  const stream = await getObjectStore().get(thumb ? image.thumbKey : image.objectKey);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": thumb ? "image/webp" : "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
