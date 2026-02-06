import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Next.js cookie API can get confused if `name` leaks into options (per @supabase/ssr)
              const opts = options ?? {};
              const { name: _omit, ...safeOptions } = opts as Record<string, unknown> & { name?: string };
              cookieStore.set(name, value, safeOptions);
            });
          } catch {
            // In Server Components, setting cookies may not be allowed; middleware handles session refresh.
          }
        },
      },
    }
  );
}
