import { SELF, fetchMock, env } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterEach } from "vitest";

/**
 * Valid test JWT token with claims:
 * - kid: test-key-123
 * - sub: auth0|test-user-456
 * - iss: https://quest-lock.uk.auth0.com/
 */
const TEST_AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5LTEyMyJ9.eyJpc3MiOiJodHRwczovL3F1ZXN0LWxvY2sudWsuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfHRlc3QtdXNlci00NTYiLCJhdWQiOlsiaHR0cHM6Ly9hcGkucXVlc3QtbG9jay5jb20iXSwiaWF0IjoxNzYxMTY0NDk1LCJleHAiOjIwNzY1MjQ0OTV9.xBCtYbefeTYejZACZq__prQAll9_W6LUEO41MUqK2tDMbt_MtC0ETqdDAkrfAOUsuK6pqzrp6Mly2KVURpn7qii6fGV8Y8xu8OU6oQTdv1dRPlsvBJ1UJNJkM8nBzjP_LTfkk5Cyy3U3XOJvFyOuEWiwntZHyDh6rN0oqeg39B2sXyAwPddimDP-YBurBlPS_1zDxlNXKvsgV8vkwpH-OJwcMAsD6_08oJh2TWQz1qd4TW2HXhPxRPc1CL4yzELhXFFBhNgLKi_-gXGfsTtH0Cqiusvq4VLXgR_Tm-EAtlY6VzFh904Y83MSwaazgg583TG6NFXmSmDl_RoSLXmc2g";

function setupJwksMock(): void {
  fetchMock
    .get("https://quest-lock.uk.auth0.com")
    .intercept({ method: "GET", path: "/.well-known/jwks.json" })
    .reply(200, JSON.stringify({
      keys: [
        {
          kty: "RSA",
          kid: "test-key-123",
          n: "2S1dXj8Oh9su-CQDtnnneQ3sPe2ZFKN3RG9vkolv6zdutoALlhdLKpnuEtBAmHxkSuq8n48PvN-YBpDw-tDIxgBBLfgDvtJMOGQdUSpVtoz-tJqa_ovEDA2vaSHj2rYvsbBeMTODpYH2KGS80h8JA31yLoFVz3mneA5hjTynmU1lcb_IR-BNBg9B52b4CHiDta6XUymXhOPtCodF_mkbP9bylIGjvHfcwY1mMk7EDgA3HE67PtuY-Wge-lWN5lJ_P6TeI8B52oJkrnw1j9Qum_JnFjYHiFYnMjyC_uxiqKCAx0Qg5oDNB78C4aD8UBMbZnG8YmlrYnNa0Sxn3FTgiw",
          e: "AQAB"
        }
      ]
    }));
}

describe("Authentication Worker", () => {
  beforeAll(async () => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  afterEach(() => {
    fetchMock.assertNoPendingInterceptors();
  });

  describe("CORS", () => {
    it("handles OPTIONS request for CORS preflight", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
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

    it("does not set CORS headers for disallowed origins", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://evil.com",
        },
        body: JSON.stringify({ token: TEST_AUTH_TOKEN }),
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Token Verification", () => {
    it("rejects requests without token field", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.text();
      expect(data).toContain("Invalid request body");
    });

    it("rejects invalid token format", async () => {
      const response = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({ token: "invalid-token-format" }),
      });

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.message).toBeDefined();
    });

    it("rejects token with invalid signature", async () => {
      setupJwksMock();

      const invalidToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5LTEyMyJ9.eyJpc3MiOiJodHRwczovL3F1ZXN0LWxvY2sudWsuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfHRlc3QtdXNlci00NTYiLCJhdWQiOlsiaHR0cHM6Ly9hcGkucXVlc3QtbG9jay5jb20iXSwiaWF0IjoxNzYxMTY0NDk1LCJleHAiOjIwNzY1MjQ0OTV9.invalidsignature";

      const response = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({ token: invalidToken }),
      });

      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.message).toBeDefined();
    });

    it("successfully verifies valid token and returns user_id", async () => {
      setupJwksMock();

      const response = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({ token: TEST_AUTH_TOKEN }),
      });

      expect(response.status).toBe(200);
      const data = await response.json() as any;
      expect(data.user_id).toBe("auth0|test-user-456");
    });

    it("caches JWKS and does not refetch on subsequent requests", async () => {
      setupJwksMock();

      const response1 = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({ token: TEST_AUTH_TOKEN }),
      });

      expect(response1.status).toBe(200);
      const data1 = await response1.json() as any;
      expect(data1.user_id).toBe("auth0|test-user-456");

      const response2 = await SELF.fetch("http://example.com/api/v1/auth/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:5173",
        },
        body: JSON.stringify({ token: TEST_AUTH_TOKEN }),
      });

      expect(response2.status).toBe(200);
      const data2 = await response2.json() as any;
      expect(data2.user_id).toBe("auth0|test-user-456");
    });
  });
});
