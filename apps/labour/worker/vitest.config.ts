import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations("./migrations");

  return {
    test: {
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.jsonc" },
          miniflare: {
            bindings: {
              ENVIRONMENT: "test",
              ALLOWED_ORIGINS: "http://localhost:5173,http://localhost:5174,http://localhost:5175",
              TEST_MIGRATIONS: migrations,
              SUBSCRIPTION_TOKEN_SALT: "changeme",
              NOTIFICATION_SERVICE_AUTH_TOKEN: "changeme",
              STRIPE_SECRET_KEY: "changeme",
              STRIPE_WEBHOOK_SECRET: "changeme"
            },
            d1Databases: {
              READ_MODEL_DB: "test-db"
            },
            workers: [
              {
                name: "fern-labour-auth-service-worker",
                modules: [
                  {
                    path: "index.js",
                    type: "ESModule",
                    contents: `
                      export default {
                        async fetch(request) {
                          const body = await request.json();
                          const token = body.token;

                          if (token && token.includes("SUCCESS")) {
                            return Response.json({
                              user: {
                                user_id: "test-user-123",
                                issuer: "test",
                                email: "test@example.com",
                                phone_number: null,
                                first_name: "Test",
                                last_name: "User",
                                name: "Test User"
                              }
                            });
                          }

                          return Response.json({ message: "Unauthorised" }, { status: 401 });
                        }
                      }
                    `,
                  },
                ],
                compatibilityDate: "2025-10-01",
              },
              {
                name: "fern-labour-notifications-worker",
                modules: [
                  {
                    path: "index.js",
                    type: "ESModule",
                    contents: `
                      export default {
                        async fetch(request) {
                          return Response.json({ success: true });
                        }
                      }
                    `,
                  },
                ],
                compatibilityDate: "2025-10-01",
              },
              {
                name: "fern-labour-user-worker",
                modules: [
                  {
                    path: "index.js",
                    type: "ESModule",
                    contents: `
                      export default {
                        async fetch(request) {
                          return Response.json({ success: true });
                        }
                      }
                    `,
                  },
                ],
                compatibilityDate: "2025-10-01",
              },
            ],
          },
        },
      },
    },
  };
});
