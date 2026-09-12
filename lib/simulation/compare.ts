import {
  MATERIAL_DIFF_THRESHOLD,
  MILESTONE_LONG_YEARS,
} from '@/lib/constants/assumptions';
import { formatHours, formatKRW } from '@/lib/format';
import type { ComparisonResult, SimulationResult } from '@/types';
import { goalAchievementInMonths } from './goal';

/** 통근시간 차이가 이보다 작으면 "같다"고 본다 */
const NEGLIGIBLE_HOURS = 1;

type AssetVerdict = 'gain' | 'loss' | 'similar';
type CommuteVerdict = 'longer' | 'shorter' | 'same';

/**
 * 비교 요약 문장을 규칙 기반으로 생성한다.
 *
 * LLM을 쓰지 않는다. AI가 숫자를 만들어내지 않게 하고(도메인 경고 #4),
 * 결과가 왜 그렇게 나왔는지 항상 코드로 설명 가능해야 하기 때문이다(#7).
 * "이직하세요" 같은 권유형 표현은 생성하지 않는다(#6).
 */
function buildSummary(
  assetDiff: number,
  hoursDiff: number,
  years: number,
): string {
  const asset: AssetVerdict =
    Math.abs(assetDiff) < MATERIAL_DIFF_THRESHOLD
      ? 'similar'
      : assetDiff > 0
        ? 'gain'
        : 'loss';

  const commute: CommuteVerdict =
    Math.abs(hoursDiff) < NEGLIGIBLE_HOURS
      ? 'same'
      : hoursDiff > 0
        ? 'longer'
        : 'shorter';

  const money = formatKRW(Math.abs(assetDiff));
  const hours = formatHours(Math.abs(hoursDiff));

  if (asset === 'gain') {
    if (commute === 'longer') {
      return `이직 시 ${years}년 동안 약 ${money}의 추가 자산을 확보할 수 있지만, 약 ${hours}을 더 통근하게 됩니다.`;
    }
    if (commute === 'shorter') {
      return `이직 시 ${years}년 동안 약 ${money}를 더 모으면서 통근시간도 약 ${hours} 줄어듭니다.`;
    }
    return `이직 시 ${years}년 동안 약 ${money}의 추가 자산을 확보할 수 있고, 통근시간은 거의 같습니다.`;
  }

  if (asset === 'loss') {
    if (commute === 'shorter') {
      return `이직 시 ${years}년 예상 자산은 약 ${money} 줄지만, 통근시간이 약 ${hours} 줄어듭니다.`;
    }
    if (commute === 'longer') {
      return `이직 시 ${years}년 예상 자산은 약 ${money} 줄고, 통근시간도 약 ${hours} 늘어납니다.`;
    }
    return `이직 시 ${years}년 예상 자산은 약 ${money} 줄고, 통근시간은 거의 같습니다.`;
  }

  if (commute === 'longer') {
    return `두 선택의 ${years}년 예상 자산 차이는 크지 않지만, 이직 시 약 ${hours}을 더 통근하게 됩니다.`;
  }
  if (commute === 'shorter') {
    return `두 선택의 ${years}년 예상 자산 차이는 크지 않지만, 이직 시 통근시간이 약 ${hours} 줄어듭니다.`;
  }
  return `두 선택의 ${years}년 예상 자산과 통근시간 차이는 크지 않습니다.`;
}

/**
 * 현재 시나리오와 이직 시나리오를 비교한다.
 * diff는 모두 `alternative - current` 방향이다.
 */
export function compareScenarios(
  current: SimulationResult,
  alternative: SimulationResult,
): ComparisonResult {
  const netWorthTenYear =
    alternative.netWorthAt.tenYear - current.netWorthAt.tenYear;
  const commuteHoursCumulative =
    alternative.commuteHours.cumulative - current.commuteHours.cumulative;

  const currentGoalMonths = goalAchievementInMonths(
    current.goal,
    current.input.age,
  );
  const alternativeGoalMonths = goalAchievementInMonths(
    alternative.goal,
    alternative.input.age,
  );

  return {
    current,
    alternative,
    diff: {
      cumulativeGrossIncomeTenYear:
        alternative.cumulativeGrossIncome.tenYear -
        current.cumulativeGrossIncome.tenYear,
      cumulativeNetIncomeTenYear:
        alternative.cumulativeNetIncome.tenYear -
        current.cumulativeNetIncome.tenYear,
      netWorthTenYear,
      commuteHoursCumulative,
      commuteCostCumulative:
        alternative.commuteCost.cumulative - current.commuteCost.cumulative,
    },
    // 한쪽이라도 기간 내 미달성이면 차이를 계산하지 않는다(외삽 금지)
    goalDiffMonths:
      currentGoalMonths !== null && alternativeGoalMonths !== null
        ? alternativeGoalMonths - currentGoalMonths
        : null,
    summary: buildSummary(
      netWorthTenYear,
      commuteHoursCumulative,
      MILESTONE_LONG_YEARS,
    ),
  };
}
