import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

/**
 * 서버(Server Component / Server Action / Route Handler)용 Supabase 클라이언트.
 *
 * Next.js 16에서 `cookies()`는 async다.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component에서는 쿠키를 쓸 수 없다.
          // 세션 갱신은 proxy.ts가 담당하므로 여기서는 무시해도 안전하다.
        }
      },
    },
  });
}
