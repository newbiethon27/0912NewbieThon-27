import { MONTHS_PER_YEAR } from '@/lib/constants/assumptions';
import type { FinancialGoal, GoalResult, NetWorthPoint } from '@/types';

/**
 * 목표 순자산 달성 시점.
 *
 * 연 단위 timeline을 월 단위로 선형 보간해 "31세 4개월" 형태로 돌려준다.
 * 시뮬레이션 기간 안에 달성하지 못하면 임의로 외삽하지 않고 미달성으로 표시한다
 * (CLAUDE.md 8.4).
 */
export function calculateGoalAchievementAge(
  timeline: NetWorthPoint[],
  goal: Pick<FinancialGoal, 'targetAge' | 'targetNetWorth'>,
  currentAge: number,
): GoalResult {
  if (timeline.length === 0) return { status: 'not_reached' };

  const target = goal.targetNetWorth;
  const crossingIndex = timeline.findIndex((p) => p.netWorth >= target);

  if (crossingIndex === -1) return { status: 'not_reached' };
  if (crossingIndex === 0) {
    return { status: 'already_achieved', age: currentAge, months: 0 };
  }

  const prev = timeline[crossingIndex - 1];
  const current = timeline[crossingIndex];
  const delta = current.netWorth - prev.netWorth;

  // prev < target <= current 이므로 delta > 0이 보장되지만,
  // 0으로 나누는 일이 절대 없도록 방어한다.
  const fraction = delta > 0 ? (target - prev.netWorth) / delta : 0;

  let age = prev.age;
  let months = Math.round(fraction * MONTHS_PER_YEAR);

  // 반올림으로 12개월이 되면 나이를 올린다
  if (months >= MONTHS_PER_YEAR) {
    age += 1;
    months -= MONTHS_PER_YEAR;
  }

  const achievedInMonths = (age - currentAge) * MONTHS_PER_YEAR + months;
  const targetInMonths = (goal.targetAge - currentAge) * MONTHS_PER_YEAR;

  return {
    status: 'achieved',
    age,
    months,
    // 양수면 목표보다 늦음
    vsTargetMonths: achievedInMonths - targetInMonths,
  };
}

/** 달성 시점을 현재 나이 기준 개월 수로. 미달성이면 null */
export function goalAchievementInMonths(
  result: GoalResult | null,
  currentAge: number,
): number | null {
  if (!result) return null;
  if (result.status === 'not_reached') return null;
  if (result.status === 'already_achieved') return 0;
  return (result.age - currentAge) * MONTHS_PER_YEAR + result.months;
}
