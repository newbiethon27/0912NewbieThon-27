import {
  MONTHS_PER_YEAR,
  WORKING_WEEKS_PER_YEAR,
} from '@/lib/constants/assumptions';
import type { SimulationInput, Won } from '@/types';
import { toFiniteInt, toFiniteNumber } from './utils';

const MINUTES_PER_HOUR = 60;

/**
 * 연간·누적 통근시간.
 * `commuteMinutesPerDay`는 하루 **왕복** 분이다.
 */
export function calculateCommuteHours(input: SimulationInput): {
  annual: number;
  cumulative: number;
} {
  const annual = toFiniteNumber(
    (input.commuteMinutesPerDay * input.officeDaysPerWeek * WORKING_WEEKS_PER_YEAR) /
      MINUTES_PER_HOUR,
  );
  return { annual, cumulative: annual * input.years };
}

/**
 * 연간·누적 교통비.
 *
 * `transportationCostMonthly`가 유일한 출처다. 이 값은 이미
 * `calculateAnnualExpenses()`의 고정 지출에 포함되어 있으므로,
 * 여기서 나온 값을 지출에 다시 더하면 안 된다(중복 차감 방지).
 *
 * 출근일이 바뀌어도 교통비는 자동으로 조정되지 않는다. 사용자가 직접 입력한다.
 */
export function calculateCommuteCost(input: SimulationInput): {
  annual: Won;
  cumulative: Won;
} {
  const annual = toFiniteInt(input.transportationCostMonthly * MONTHS_PER_YEAR);
  return { annual, cumulative: toFiniteInt(annual * input.years) };
}
