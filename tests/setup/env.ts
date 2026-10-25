export const TEST_ENV = {
  DATABASE_URL: "postgres://gado:gado@localhost:5432/gado_certo_test",
  S3_ENDPOINT: "localhost",
  S3_PORT: "9000",
  S3_USE_SSL: "false",
  S3_ACCESS_KEY: "gado",
  S3_SECRET_KEY: "gado-minio-secret",
  S3_BUCKET: "animal-images",
};

Object.assign(process.env, TEST_ENV);
