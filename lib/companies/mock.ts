import type { Company } from '@/types';

/**
 * 개발/데모 전용 mock 회사 데이터.
 *
 * ⚠️ 실제 공시값이 아니다. 절대 실제 통계처럼 보여주면 안 된다
 * (CLAUDE.md 도메인 경고 #5).
 *
 * - `isMock: true` — UI는 반드시 MockDataBadge를 노출한다.
 * - `dataYear: null` — 실제 공시 연도인 것처럼 보이지 않게 비워 둔다.
 * - 값은 눈에 띄게 반올림된 근사치만 쓴다.
 *
 * 평소 검색은 Supabase `companies` 테이블(같은 데이터로 시드됨)을 쓴다.
 * 이 배열은 DB 조회 자체가 실패했을 때의 최종 fallback이다.
 * id가 UUID가 아니므로 FK로 저장되지 않고 회사명만 기록된다.
 */
export const MOCK_COMPANIES: Company[] = [
  mock('samsung-electronics', '삼성전자', 130_000_000, 13.0, 120_000),
  mock('sk-hynix', 'SK하이닉스', 120_000_000, 12.0, 30_000),
  mock('naver', 'NAVER', 120_000_000, 6.0, 4_500),
  mock('kakao', '카카오', 110_000_000, 6.0, 4_000),
  mock('hyundai-motor', '현대자동차', 110_000_000, 19.0, 70_000),
  mock('lg-electronics', 'LG전자', 110_000_000, 14.0, 35_000),
  mock('samsung-sds', '삼성SDS', 100_000_000, 12.0, 12_000),
  mock('krafton', '크래프톤', 120_000_000, 4.0, 1_700),
  mock('ncsoft', '엔씨소프트', 110_000_000, 6.0, 4_700),
];

function mock(
  slug: string,
  name: string,
  averageSalary: number,
  averageTenure: number,
  employeeCount: number,
): Company {
  return {
    // UUID가 아닌 sentinel. DB row가 아니라는 뜻이다.
    id: `mock:${slug}`,
    name,
    dartCorpCode: null,
    averageSalary,
    averageTenure,
    employeeCount,
    dataYear: null,
    isMock: true,
  };
}

/** DB를 쓸 수 없을 때의 이름 부분일치 검색 */
export function searchMockCompanies(query: string): Company[] {
  const q = query.trim().toLowerCase();
  if (!q) return MOCK_COMPANIES;
  return MOCK_COMPANIES.filter((company) =>
    company.name.toLowerCase().includes(q),
  );
}

/** DB row가 아닌 sentinel id인지 */
export function isMockCompanyId(id: string | null): boolean {
  return typeof id === 'string' && id.startsWith('mock:');
}
