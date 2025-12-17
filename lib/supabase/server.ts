import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase server client with cookie handling.
 * Always create a new client within each function - don't store in globals.
 */
export async function createClient() {
  const cookieStore = await cookies()

    return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
}

export { createClient as createServerClient }
