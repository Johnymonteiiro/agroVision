import { execSync } from "node:child_process";
import { Client as MinioClient } from "minio";
import pg from "pg";
import { describe, expect, it } from "vitest";

// Projeto Compose separado: `down -v` aqui nunca apaga os volumes de desenvolvimento.
const SMOKE = "gado-smoke";
const run = (cmd: string) => execSync(cmd, { stdio: "pipe", timeout: 900_000 }).toString();

describe("docker compose", () => {
  it(
    "sobe do zero com bucket privado, migracoes e app na porta 3000",
    async () => {
      // Libera as portas do ambiente de desenvolvimento sem apagar dados.
      run("docker compose stop");
      try {
        run(`docker compose -p ${SMOKE} down -v`);
        run(`docker compose -p ${SMOKE} up -d --wait --build`);

        const minio = new MinioClient({
          endPoint: "localhost",
          port: 9000,
          useSSL: false,
          accessKey: "gado",
          secretKey: "gado-minio-secret",
        });
        expect(await minio.bucketExists("animal-images")).toBe(true);
        const anonymous = await fetch("http://localhost:9000/animal-images/");
        expect(anonymous.status).toBe(403);

        const db = new pg.Client({ connectionString: "postgres://gado:gado@localhost:5432/gado_certo" });
        await db.connect();
        const tables = await db.query(
          "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
        );
        await db.end();
        expect(tables.rows.map((r) => r.table_name)).toEqual(["animal_images", "animals"]);

        const page = await fetch("http://localhost:3000/animais");
        expect(page.status).toBe(200);
      } finally {
        run(`docker compose -p ${SMOKE} down -v`);
        run("docker compose up -d --wait db minio");
      }
    },
    1_200_000,
  );
});
