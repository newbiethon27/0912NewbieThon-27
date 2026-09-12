import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/dal';
import { searchCompanies } from '@/lib/companies';
import { isSupabaseConfigured } from '@/lib/supabase/env';

/**
 * 회사 검색 API.
 *
 * 외부 API 키는 서버에서만 쓰이며 이 응답에 절대 포함되지 않는다.
 * DART 키가 없어도 DB(mock 시드) → 인메모리 mock 순으로 항상 결과를 돌려준다.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase 설정이 필요합니다. .env.local을 확인하세요.' },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get('q') ?? '';
  const { companies, source } = await searchCompanies(query);

  return NextResponse.json({ companies, source });
}
