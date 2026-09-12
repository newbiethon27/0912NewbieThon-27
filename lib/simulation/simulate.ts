import {
  MILESTONE_LONG_YEARS,
  MILESTONE_SHORT_YEARS,
} from '@/lib/constants/assumptions';
import type {
  FinancialGoal,
  IncomePoint,
  MilestoneAmounts,
  SimulationInput,
  SimulationResult,
  Won,
} from '@/types';
import { calculateCommuteCost, calculateCommuteHours } from './commute';
import { calculateGoalAchievementAge } from './goal';
import { calculateIncomeTimeline, monthlyNetIncome } from './income';
import { calculateNetWorthTimeline, netWorthAtYear } from './networth';

/**
 * 누적 소득은 t=1..N의 합이다.
 * t=0("현재")은 이미 지난 시점이라 포함하지 않는다. 포함하면 11년치가 된다.
 */
function sumIncomeThrough(
  points: IncomePoint[],
  throughYear: number,
  key: 'gross' | 'net',
): Won {
  return points.reduce(
    (total, point) =>
      point.t >= 1 && point.t <= throughYear ? total + point[key] : total,
    0,
  );
}

function milestoneIncome(
  points: IncomePoint[],
  key: 'gross' | 'net',
): MilestoneAmounts {
  return {
    fiveYear: sumIncomeThrough(points, MILESTONE_SHORT_YEARS, key),
    tenYear: sumIncomeThrough(points, MILESTONE_LONG_YEARS, key),
  };
}

/**
 * 하나의 시나리오를 끝까지 계산한다.
 *
 * 순수 함수다 — DB/fetch/현재시각에 의존하지 않는다. 그래서 서버 컴포넌트와
 * Compare 화면의 클라이언트 양쪽에서 동일하게 호출할 수 있고,
 * 사용자가 조건을 바꾸면 서버 왕복 없이 즉시 재계산된다.
 */
export function runSimulation(params: {
  label: string;
  input: SimulationInput;
  goal?: Pick<FinancialGoal, 'targetAge' | 'targetNetWorth'> | null;
}): SimulationResult {
  const { label, input, goal } = params;

  const income = calculateIncomeTimeline(input);
  const netWorth = calculateNetWorthTimeline(input);

  const monthlyNet = monthlyNetIncome(input);
  // 세후 소득이 0이면 저축률은 정의되지 않는다(0으로 나누기 방지)
  const savingsRate =
    monthlyNet > 0 ? input.savingsMonthly / monthlyNet : null;

  return {
    label,
    input,
    income,
    netWorth,
    cumulativeGrossIncome: milestoneIncome(income, 'gross'),
    cumulativeNetIncome: milestoneIncome(income, 'net'),
    netWorthAt: {
      fiveYear: netWorthAtYear(netWorth, MILESTONE_SHORT_YEARS),
      tenYear: netWorthAtYear(netWorth, MILESTONE_LONG_YEARS),
    },
    commuteHours: calculateCommuteHours(input),
    commuteCost: calculateCommuteCost(input),
    savingsRate,
    goal: goal ? calculateGoalAchievementAge(netWorth, goal, input.age) : null,
  };
}
