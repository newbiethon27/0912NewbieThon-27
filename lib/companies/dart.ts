import 'server-only';

import type { Company } from '@/types';

/**
 * OpenDART 연동.
 *
 * 아직 스텁이다. P0가 전부 끝난 뒤에 구현한다(계획 Step 10).
 * 지금은 인터페이스만 확정해 두어, 나중에 이 파일만 채우면
 * 호출부(lib/companies/index.ts)를 고치지 않아도 되게 한다.
 *
 * 규칙:
 * - API 키(DART_API_KEY)는 서버에서만 읽는다. 클라이언트에 절대 노출하지 않는다.
 * - 실패하거나 키가 없으면 **예외를 던지지 않고** null을 돌려준다.
 *   호출부가 mock으로 fallback 할 수 있어야 앱이 죽지 않는다.
 */

export function isDartConfigured(): boolean {
  return Boolean(process.env.DART_API_KEY);
}

export async function searchDartCompanies(
  _query: string,
): Promise<Company[] | null> {
  if (!isDartConfigured()) return null;

  // TODO(Step 10): corpCode 조회 + 직원현황 API 호출.
  // 구현 전까지는 null을 돌려 DB/mock 경로를 타게 한다.
  return null;
}
