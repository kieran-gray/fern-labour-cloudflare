import { env } from "cloudflare:workers";

const getAuthHeader = (headers: Headers): string | null => {
  const authHeader = "CF_Authorization";
  let cfAuth = headers.get(authHeader);
  if (cfAuth) {
    return cfAuth;
  }

  const value = `; ${headers.get("Cookie")}`;
  const parts = value.split(`; ${authHeader}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }

  return null;
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const cfAuth = getAuthHeader(request.headers);
      if (!cfAuth) return new Response("Unauthorized", { status: 401 });

      const headers = new Headers(request.headers);
      headers.set("Origin", url.origin);
      headers.set("Authorization", `Bearer ${cfAuth}`);
      const modifiedRequest = new Request(request, { headers });

      if (url.pathname.startsWith("/api/v1/contact")) {
        return await env.CONTACT_US_API.fetch(modifiedRequest);
      } else if (url.pathname.startsWith("/api/v1/notification")) {
        return await env.NOTIFICATIONS_API.fetch(modifiedRequest);
      } else if (url.pathname.startsWith("/api/v1/command")) {
        return await env.NOTIFICATIONS_API.fetch(modifiedRequest);
      } else if (url.pathname.startsWith("/api/v1/admin")) {
        return await env.NOTIFICATIONS_API.fetch(modifiedRequest);
      }
    }
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
