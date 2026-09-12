import { Card } from '@/components/ui/card';
import {
  MILESTONE_LONG_YEARS,
  MILESTONE_SHORT_YEARS,
  SIMULATION_YEARS,
} from '@/lib/constants/assumptions';
import { formatGoalResult, formatHours, formatKRW } from '@/lib/format';
import type { SimulationResult } from '@/types';

/**
 * 한 시나리오의 결과 카드.
 * 제목 옆 색 점이 차트의 계열과 신원을 잇는다(글자에 계열 색을 입히지 않는다).
 */
export function ScenarioResultCard({
  result,
  color,
  caption,
}: {
  result: SimulationResult;
  color: string;
  caption?: string;
}) {
  const goalText = formatGoalResult(result.goal, SIMULATION_YEARS);

  const rows = [
    {
      label: `${MILESTONE_SHORT_YEARS}년 누적 소득 (세전)`,
      value: formatKRW(result.cumulativeGrossIncome.fiveYear),
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 누적 소득 (세전)`,
      value: formatKRW(result.cumulativeGrossIncome.tenYear),
    },
    {
      label: `${MILESTONE_SHORT_YEARS}년 예상 순자산`,
      value: formatKRW(result.netWorthAt.fiveYear),
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 예상 순자산`,
      value: formatKRW(result.netWorthAt.tenYear),
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 누적 통근시간`,
      value: formatHours(result.commuteHours.cumulative),
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 누적 교통비`,
      value: formatKRW(result.commuteCost.cumulative),
    },
    { label: '목표 자산 달성 예상', value: goalText.value },
  ];

  return (
    <Card className="gap-0 p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-base font-semibold">{result.label}</h3>
      </div>
      {caption && (
        <p className="text-muted-foreground mt-1 text-xs">{caption}</p>
      )}

      <dl className="mt-5 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <dt className="text-muted-foreground text-xs">{row.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
