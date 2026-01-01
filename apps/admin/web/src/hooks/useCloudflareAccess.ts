import { useState, useEffect } from "react";

export interface CloudflareAccessIdentity {
  email: string;
  name?: string;
  user_uuid?: string;
  [key: string]: unknown;
}

export function useCloudflareAccess() {
  const [user, setUser] = useState<CloudflareAccessIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const response = await fetch("/cdn-cgi/access/get-identity");

        if (!response.ok) {
          throw new Error(`Failed to fetch identity: ${response.status}`);
        }

        const identity = await response.json();
        setUser(identity);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Cloudflare Access auth error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdentity();
  }, []);

  const logout = () => {
    window.location.href = "/cdn-cgi/access/logout";
  };

  return {
    user,
    isLoading,
    error,
    logout,
  };
}
