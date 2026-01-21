import { defineWorkersConfig} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  return {
    test: {
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.toml" },
          miniflare: {
            bindings: {
              ENVIRONMENT: "test",
              ALLOWED_ORIGINS: "http://localhost:5173,http://localhost:5174,http://localhost:5175",
            },
          },
        },
      },
    },
  };
});