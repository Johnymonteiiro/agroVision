import { readCategoryImage, uploadCategoryImage } from "@/modules/categories/server/image";

// Imagem do cartão da categoria (dataset-ajustes, S4).
export async function PUT(request: Request, ctx: RouteContext<"/api/categories/[id]/image">) {
  const { id } = await ctx.params;
  return uploadCategoryImage(request, id);
}

export async function GET(_request: Request, ctx: RouteContext<"/api/categories/[id]/image">) {
  const { id } = await ctx.params;
  return readCategoryImage(id);
}
