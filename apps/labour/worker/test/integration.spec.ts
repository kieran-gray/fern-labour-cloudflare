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

      expect(response.status).toBe(404);
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
});
