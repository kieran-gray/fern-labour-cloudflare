import { SELF, env, applyD1Migrations } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";

describe("Labour Worker", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.READ_MODEL_DB, env.TEST_MIGRATIONS);
  });

  describe("General", () => {
    it("responds with 404 for unknown routes", async () => {
      const response = await SELF.fetch("http://example.com/unknown-route");
      expect(response.status).toBe(404);
    });
  });

  describe("CORS", () => {
    it("handles OPTIONS request for CORS preflight on /api/v1/labour/plan", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/plan", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:5173",
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    });

    it("handles OPTIONS request for CORS preflight on /api/v1/command", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:5174",
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5174");
    });

    it("blocks requests from disallowed origins", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://evil.com",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(403);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Authentication", () => {
    it("rejects requests without Authorization header", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
      expect(await response.text()).toContain("Unauthorised");
    });

    it("rejects requests with invalid Authorization token", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(403);
      expect(await response.text()).toContain("User verification failed");
    });

    it("rejects GET /api/v1/labour/history without auth", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/history", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
        },
      });

      expect(response.status).toBe(401);
    });

    it("rejects GET /api/v1/labour/active without auth", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/active", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
        },
      });

      expect(response.status).toBe(401);
    });

    it("rejects GET /api/v1/subscriptions/list without auth", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/subscriptions/list", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
        },
      });

      expect(response.status).toBe(401);
    });

    it("rejects POST /api/v1/command without auth", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
    });

    it("rejects POST /api/v1/query without auth", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Authenticated Routes", () => {
    it("accepts authenticated GET /api/v1/labour/history", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/history", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
    });

    it("accepts authenticated GET /api/v1/labour/active", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/labour/active", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toBeNull();
    });

    it("accepts authenticated GET /api/v1/subscriptions/list", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/subscriptions/list", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it("accepts authenticated GET /api/v1/subscriptions/labours", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/subscriptions/labours", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  /**
   * NOTE: DO bindings are not supported in the vitest-pool-workers environment for Rust WASM workers.
   *
   * See: https://developers.cloudflare.com/workers/testing/vitest-integration/durable-objects/
   */

  describe.skip("Labour Lifecycle", () => {
    it("can plan a new labour", async () => {
      const labourId = crypto.randomUUID();

      const command = {
        type: "Labour",
        payload: {
          type: "PlanLabour",
          payload: {
            labour_id: labourId,
            mother_id: "test-user-123",
            mother_name: "Test User",
            first_labour: true,
            due_date: new Date().toISOString(),
            labour_name: "Baby Smith",
          },
        },
      };

      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(command),
      });

      expect(response.status).toBe(200);
    });

    it("can retrieve active labour after planning", async () => {
      const labourId = crypto.randomUUID();

      // Plan the labour first
      const planCommand = {
        type: "Labour",
        payload: {
          type: "PlanLabour",
          payload: {
            labour_id: labourId,
            mother_id: "test-user-123",
            mother_name: "Test User",
            first_labour: true,
            due_date: new Date().toISOString(),
            labour_name: "Active Test",
          },
        },
      };

      await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(planCommand),
      });

      // Check active labour
      const response = await SELF.fetch("http://example.com/api/v1/labour/active", {
        method: "GET",
        headers: {
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).not.toBeNull();
      expect(data.labour_id).toBe(labourId);
    });

    it("can begin a labour", async () => {
      const labourId = crypto.randomUUID();

      // Plan first
      const planCommand = {
        type: "Labour",
        payload: {
          type: "PlanLabour",
          payload: {
            labour_id: labourId,
            mother_id: "test-user-123",
            mother_name: "Test User",
            first_labour: true,
            due_date: new Date().toISOString(),
            labour_name: null,
          },
        },
      };

      await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(planCommand),
      });

      // Begin labour
      const beginCommand = {
        type: "Labour",
        payload: {
          type: "BeginLabour",
          payload: {
            labour_id: labourId,
          },
        },
      };

      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(beginCommand),
      });

      expect(response.status).toBe(200);
    });

    it("can complete a labour", async () => {
      const labourId = crypto.randomUUID();

      // Plan and begin
      const planCommand = {
        type: "Labour",
        payload: {
          type: "PlanLabour",
          payload: {
            labour_id: labourId,
            mother_id: "test-user-123",
            mother_name: "Test User",
            first_labour: true,
            due_date: new Date().toISOString(),
            labour_name: null,
          },
        },
      };

      await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(planCommand),
      });

      const beginCommand = {
        type: "Labour",
        payload: { type: "BeginLabour", payload: { labour_id: labourId } },
      };

      await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(beginCommand),
      });

      // Complete
      const completeCommand = {
        type: "Labour",
        payload: {
          type: "CompleteLabour",
          payload: {
            labour_id: labourId,
            notes: "Baby arrived safely!",
          },
        },
      };

      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(completeCommand),
      });

      expect(response.status).toBe(200);
    });
  });

  describe.skip("Contraction Tracking", () => {
    it("can start a contraction", async () => {
      const labourId = crypto.randomUUID();
      const contractionId = crypto.randomUUID();

      // Plan and begin labour first
      await planAndBeginLabour(labourId);

      const startCommand = {
        type: "Contraction",
        payload: {
          type: "StartContraction",
          payload: {
            labour_id: labourId,
            contraction_id: contractionId,
            start_time: new Date().toISOString(),
          },
        },
      };

      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(startCommand),
      });

      expect(response.status).toBe(200);
    });

    it("can end a contraction", async () => {
      const labourId = crypto.randomUUID();
      const contractionId = crypto.randomUUID();

      await planAndBeginLabour(labourId);

      // Start
      const startCommand = {
        type: "Contraction",
        payload: {
          type: "StartContraction",
          payload: {
            labour_id: labourId,
            contraction_id: contractionId,
            start_time: new Date(Date.now() - 60000).toISOString(),
          },
        },
      };

      await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(startCommand),
      });

      // End
      const endCommand = {
        type: "Contraction",
        payload: {
          type: "EndContraction",
          payload: {
            labour_id: labourId,
            contraction_id: contractionId,
            end_time: new Date().toISOString(),
            intensity: 5,
          },
        },
      };

      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(endCommand),
      });

      expect(response.status).toBe(200);
    });

    it("can delete a contraction", async () => {
      const labourId = crypto.randomUUID();
      const contractionId = crypto.randomUUID();

      await planAndBeginLabour(labourId);

      // Start and end
      await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify({
          type: "Contraction",
          payload: {
            type: "StartContraction",
            payload: { labour_id: labourId, contraction_id: contractionId, start_time: new Date(Date.now() - 60000).toISOString() },
          },
        }),
      });

      await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify({
          type: "Contraction",
          payload: {
            type: "EndContraction",
            payload: { labour_id: labourId, contraction_id: contractionId, end_time: new Date().toISOString(), intensity: 3 },
          },
        }),
      });

      // Delete
      const deleteCommand = {
        type: "Contraction",
        payload: {
          type: "DeleteContraction",
          payload: { labour_id: labourId, contraction_id: contractionId },
        },
      };

      const response = await SELF.fetch("http://example.com/api/v1/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(deleteCommand),
      });

      expect(response.status).toBe(200);
    });
  });

  describe.skip("Query Endpoint", () => {
    it("can query contractions for a labour", async () => {
      const labourId = crypto.randomUUID();

      await planAndBeginLabour(labourId);

      const query = {
        type: "Contractions",
        payload: {
          labour_id: labourId,
          limit: 10,
          cursor: null,
        },
      };

      const response = await SELF.fetch("http://example.com/api/v1/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
          Authorization: "Bearer SUCCESS-token",
        },
        body: JSON.stringify(query),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("items");
      expect(Array.isArray(data.items)).toBe(true);
    });
  });
});

// Helper function
async function planAndBeginLabour(labourId: string) {
  await SELF.fetch("http://example.com/api/v1/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5173",
      Authorization: "Bearer SUCCESS-token",
    },
    body: JSON.stringify({
      type: "Labour",
      payload: {
        type: "PlanLabour",
        payload: {
          labour_id: labourId,
          mother_id: "test-user-123",
          mother_name: "Test User",
          first_labour: true,
          due_date: new Date().toISOString(),
          labour_name: null,
        },
      },
    }),
  });

  await SELF.fetch("http://example.com/api/v1/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:5173",
      Authorization: "Bearer SUCCESS-token",
    },
    body: JSON.stringify({
      type: "Labour",
      payload: {
        type: "BeginLabour",
        payload: { labour_id: labourId },
      },
    }),
  });
}
