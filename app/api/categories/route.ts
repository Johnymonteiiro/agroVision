import { createCategory } from "@/lib/categories/repo";
import { CATEGORY_MESSAGES, validateNewCategory } from "@/lib/categories/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = validateNewCategory(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid", fields: parsed.fields }, { status: 422 });
  }

  const result = await createCategory(parsed.data);
  if (result.status === "duplicate") {
    return Response.json({ error: "duplicate", fields: { name: CATEGORY_MESSAGES.duplicate } }, { status: 409 });
  }
  return Response.json({ category: result.category }, { status: result.status === "created" ? 201 : 200 });
}
