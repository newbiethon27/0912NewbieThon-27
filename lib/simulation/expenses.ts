import { MONTHS_PER_YEAR } from '@/lib/constants/assumptions';
import type { SimulationInput, Won } from '@/types';
import { toFiniteInt } from './utils';

/**
 * 월 고정 지출 합계.
 *
 * 교통비는 여기 정확히 한 번만 들어간다. `calculateCommuteCost()`는 같은 필드를
 * 읽는 표시용 파생 지표이며, 지출에 다시 더하지 않는다(중복 차감 방지).
 * 대출 상환액은 연도마다 잔여 부채에 따라 달라지므로 여기 포함하지 않는다.
 */
export function calculateMonthlyFixedExpenses(input: SimulationInput): Won {
  return toFiniteInt(
    input.housingCostMonthly +
      input.livingCostMonthly +
      input.transportationCostMonthly +
      input.insuranceCostMonthly,
  );
}

/**
 * 연간 총지출 = 월 고정 지출 × 12 + 해당 연도 실제 대출 상환액.
 *
 * `debtPaidThisYear`를 인자로 받는 이유: 부채가 소진된 해부터는 상환액이
 * 0이 되어 그만큼 잉여현금으로 전환되어야 하기 때문이다.
 */
export function calculateAnnualExpenses(
  input: SimulationInput,
  debtPaidThisYear: Won,
): Won {
  return toFiniteInt(
    calculateMonthlyFixedExpenses(input) * MONTHS_PER_YEAR +
      toFiniteInt(debtPaidThisYear),
  );
}

/**
 * 온보딩 Step 3 정합성 검사용 월 잉여현금.
 * (대출 상환액은 현재 잔액이 충분하다고 보고 전액 반영)
 */
export function monthlySurplus(input: SimulationInput, monthlyNet: Won): Won {
  return toFiniteInt(
    monthlyNet - calculateMonthlyFixedExpenses(input) - input.debtPaymentMonthly,
  );
}
