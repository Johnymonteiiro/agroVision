import { uploadAnimalImage } from "@/lib/images/upload";

export async function POST(request: Request, ctx: RouteContext<"/api/animals/[id]/images">) {
  const { id } = await ctx.params;
  return uploadAnimalImage(request, id);
}
