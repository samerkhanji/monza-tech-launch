// src/integrations/supabase/client.ts
// Auto-generated scaffold (safe). You can keep this as your canonical client.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Read from Vite env (.env.local / .env)
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fail fast in prod; warn in dev
if (!url || !anon) {
  const msg =
    "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local";
  if (import.meta.env.DEV) {
    console.warn("ℹ️", msg);
  } else {
    throw new Error(msg);
  }
}

export const supabase = createClient<Database>(url!, anon!, {
  db: { schema: "public" },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce", // best for SPAs
  },
  global: {
    // Example: add app/version header if you want
    headers: { "x-monza-app": "monza-tech-ui" },
  },
});