import { Badge } from '@/components/ui/badge';

/**
 * mock 회사 데이터임을 표시하는 배지.
 *
 * CLAUDE.md 도메인 경고 #5: 가짜 데이터를 실제 통계처럼 보여주지 않는다.
 * mock 회사 정보를 노출하는 모든 지점에 반드시 붙인다.
 */
export function MockDataBadge() {
  return (
    <Badge
      variant="outline"
      className="border-amber-300 bg-amber-50 text-[11px] font-medium text-amber-700"
    >
      데모 데이터
    </Badge>
  );
}
