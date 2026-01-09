import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  return {
    test: {
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.jsonc" },
          miniflare: {
            bindings: {
              ENVIRONMENT: "test",
              ALLOWED_ORIGINS: "http://localhost:5173,http://localhost:5174,http://localhost:5175",
              AUTH_ISSUERS: {
                auth0: {
                  issuer_url: "https://quest-lock.uk.auth0.com/",
                  jwks_path: ".well-known/jwks.json",
                  audience: "https://api.quest-lock.com",
                  name: "Auth0"
                }
              },
            },
            kvNamespaces: {
              AUTH_JWKS_CACHE: "test-jwks-cache"
            },
          },
        },
      },
    },
  };
});