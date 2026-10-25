import { describe, expect, it } from "vitest";
import { BUCKET, minio } from "../helpers/fixtures";

describe("bucket animal-images", () => {
  it("leitura anonima negada com 403", async () => {
    const key = `policy-check/${Date.now()}.txt`;
    await minio.putObject(BUCKET, key, Buffer.from("x"));
    try {
      const res = await fetch(`http://localhost:9000/${BUCKET}/${key}`);
      expect(res.status).toBe(403);
    } finally {
      await minio.removeObject(BUCKET, key);
    }
  });
});
