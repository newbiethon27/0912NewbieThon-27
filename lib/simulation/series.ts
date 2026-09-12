import type { ComparisonResult } from '@/types';

/**
 * 두 시나리오를 하나의 차트 데이터로 합친다.
 * 컴포넌트가 배열을 주무르지 않도록 여기서 형태를 맞춰 준다.
 */

export interface ComparisonSeriesPoint {
  age: number;
  current: number;
  alternative: number;
}

export type ComparisonMetric = 'netWorth' | 'income';

export function toComparisonSeries(
  comparison: ComparisonResult,
  metric: ComparisonMetric,
): ComparisonSeriesPoint[] {
  const { current, alternative } = comparison;

  if (metric === 'netWorth') {
    return current.netWorth.map((point, index) => ({
      age: point.age,
      current: point.netWorth,
      alternative: alternative.netWorth[index]?.netWorth ?? point.netWorth,
    }));
  }

  return current.income.map((point, index) => ({
    age: point.age,
    current: point.gross,
    alternative: alternative.income[index]?.gross ?? point.gross,
  }));
}
