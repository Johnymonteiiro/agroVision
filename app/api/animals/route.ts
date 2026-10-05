import { createAnimal } from "@/lib/animals/repo";
import { MESSAGES, validateNewAnimal } from "@/lib/animals/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = validateNewAnimal(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid", fields: parsed.fields }, { status: 422 });
  }

  const result = await createAnimal(parsed.data);
  if (result.status === "duplicate") {
    return Response.json(
      { error: "duplicate", fields: { externalId: MESSAGES.duplicate } },
      { status: 409 },
    );
  }
  return Response.json({ animal: result.animal }, { status: result.status === "created" ? 201 : 200 });
}
