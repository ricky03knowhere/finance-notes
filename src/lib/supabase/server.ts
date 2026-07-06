import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type CookieOptions = {
  path?: string;
  maxAge?: number;
  domain?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  httpOnly?: boolean;
  expires?: Date;
};

export async function createSupabaseServerClient() {
  const cookieStore = (await cookies()) as unknown as {
    get(name: string): { value: string } | undefined;
    set(cookie: { name: string; value: string } & CookieOptions): void;
    remove?(name: string, options?: CookieOptions): void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    },
  );
}