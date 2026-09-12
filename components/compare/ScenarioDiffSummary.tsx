import { Card } from '@/components/ui/card';
import { MILESTONE_LONG_YEARS } from '@/lib/constants/assumptions';
import {
  formatMonthsSpan,
  formatSignedHours,
  formatSignedKRW,
} from '@/lib/format';
import type { ComparisonResult } from '@/types';
import { cn } from '@/lib/utils';

/** 좋고 나쁨이 아니라 증감만 표시한다. 권유하지 않는다 */
function toneFor(value: number, lowerIsBetter = false) {
  if (value === 0) return 'text-muted-foreground';
  const positive = lowerIsBetter ? value < 0 : value > 0;
  return positive ? 'text-emerald-700' : 'text-destructive';
}

export function ScenarioDiffSummary({
  comparison,
}: {
  comparison: ComparisonResult;
}) {
  const { diff, goalDiffMonths } = comparison;

  const rows = [
    {
      label: `${MILESTONE_LONG_YEARS}년 누적 소득 (세전)`,
      value: formatSignedKRW(diff.cumulativeGrossIncomeTenYear),
      tone: toneFor(diff.cumulativeGrossIncomeTenYear),
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 예상 순자산`,
      value: formatSignedKRW(diff.netWorthTenYear),
      tone: toneFor(diff.netWorthTenYear),
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 누적 통근시간`,
      value: formatSignedHours(diff.commuteHoursCumulative),
      tone: toneFor(diff.commuteHoursCumulative, true),
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 누적 교통비`,
      value: formatSignedKRW(diff.commuteCostCumulative),
      tone: toneFor(diff.commuteCostCumulative, true),
    },
    {
      label: '목표 달성 시점',
      value:
        goalDiffMonths === null
          ? '비교 불가'
          : goalDiffMonths === 0
            ? '동일'
            : goalDiffMonths < 0
              ? `${formatMonthsSpan(goalDiffMonths)} 빠름`
              : `${formatMonthsSpan(goalDiffMonths)} 늦음`,
      tone:
        goalDiffMonths === null
          ? 'text-muted-foreground'
          : toneFor(goalDiffMonths, true),
    },
  ];

  return (
    <Card className="gap-0 p-6">
      <h3 className="text-base font-semibold">이직했을 때의 차이</h3>
      <p className="mt-3 text-sm leading-relaxed">{comparison.summary}</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="bg-muted/40 rounded-lg p-3">
            <dt className="text-muted-foreground text-xs">{row.label}</dt>
            <dd
              className={cn(
                'mt-1 text-sm font-semibold tabular-nums',
                row.tone,
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-muted-foreground mt-4 text-xs">
        모든 차이는 &ldquo;이직 시나리오 − 현재 회사 유지&rdquo; 기준입니다.
        {goalDiffMonths === null &&
          ' 한쪽 시나리오가 기간 내 목표에 도달하지 않아 달성 시점은 비교하지 않았습니다.'}
      </p>
    </Card>
  );
}
