import { cookies } from "next/headers";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase auth endpoint must be the real project URL, not the Cloudflare
// proxy — PKCE code exchange posts directly to /auth/v1/token on this host.
function authUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL");
  return url;
}

function anonKey(): string {
  const key =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing SUPABASE_ANON_KEY");
  return key;
}

/**
 * SSR-aware server client. Uses Next.js cookies() so Supabase can persist the
 * PKCE code_verifier between the magic-link request and the callback exchange.
 * Must be called from a Route Handler or Server Action so cookies are writable.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(authUrl(), anonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(items) {
        try {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't write cookies — ignore. Route Handlers can.
        }
      },
    },
  });
}

/** Browser client — only used for storage uploads today. */
export function getSupabaseBrowserClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_* env vars");
  return createBrowserClient(url, key);
}

/** Service-role client for admin operations (user upload, bucket creation). */
let cachedServiceClient: SupabaseClient | null = null;
export function getSupabaseServiceClient(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  cachedServiceClient = createClient(authUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedServiceClient;
}
