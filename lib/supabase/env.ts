/**
 * Supabase 환경변수 접근.
 *
 * 환경변수가 없을 때 가짜 세션이나 더미 저장으로 덮지 않는다.
 * 설정이 필요하다는 사실을 그대로 화면에 드러낸다.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase 환경변수가 없습니다. .env.example을 .env.local로 복사한 뒤 ' +
        'NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 채우고 개발 서버를 재시작하세요.',
    );
  }

  return { url, anonKey };
}
