/**
 * 시뮬레이션 엔진 공개 API.
 *
 * 이 디렉터리의 모든 함수는 pure function이다.
 * fetch / Supabase / Date.now() 등 부수효과를 절대 쓰지 않는다.
 * 기준 시점이 필요하면 인자로 받는다.
 */

export { calculateCommuteCost, calculateCommuteHours } from './commute';
export { compareScenarios } from './compare';
export {
  calculateAnnualExpenses,
  calculateMonthlyFixedExpenses,
  monthlySurplus,
} from './expenses';
export { calculateGoalAchievementAge, goalAchievementInMonths } from './goal';
export {
  calculateAnnualIncome,
  calculateGrossSalary,
  calculateIncomeTimeline,
  estimateNetIncome,
  monthlyNetIncome,
} from './income';
export { calculateNetWorthTimeline, netWorthAtYear } from './networth';
export { runSimulation } from './simulate';
