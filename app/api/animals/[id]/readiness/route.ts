import { z } from "zod";
import { updateReadiness } from "@/modules/animals/server/repo";
import { firstErrors } from "@/modules/core/validation/errors";
import { readinessChangeSchema } from "@/modules/animals/validation";

export async function PUT(request: Request, ctx: RouteContext<"/api/animals/[id]/readiness">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "animal_not_found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = readinessChangeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid", fields: firstErrors(parsed.error) }, { status: 422 });
  }

  try {
    const result = await updateReadiness(id, parsed.data);
    if (!result) return Response.json({ error: "animal_not_found" }, { status: 404 });
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("mudança de rótulo falhou no banco", { animalId: id, error });
    return Response.json({ error: "database_error" }, { status: 500 });
  }
}
