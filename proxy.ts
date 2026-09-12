import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

/**
 * Next.js 16에서 middleware는 proxy로 이름이 바뀌었다(런타임은 nodejs 고정).
 *
 * 역할은 두 가지다:
 *   1. Supabase 세션 토큰 갱신 (쿠키 재기록)
 *   2. 낙관적 리다이렉트 — 미인증 사용자를 보호 경로에서 걷어낸다
 *
 * 여기서 DB를 조회하지 않는다(프리페치 포함 모든 요청에서 실행되므로).
 * "프로필이 없으면 /onboarding" 같은 판단은 각 페이지의 DAL이 담당한다.
 * 실제 데이터 보호는 DAL + RLS다. 이 파일은 1차 방어선일 뿐이다.
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/compare',
  '/settings',
  '/onboarding',
];

const AUTH_PAGES = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  // 환경변수가 없으면 통과시킨다. 각 페이지가 설정 안내 화면을 띄운다.
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 정적 자산과 이미지 최적화 요청을 제외한 모든 경로.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
