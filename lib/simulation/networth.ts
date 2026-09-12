import { MONTHS_PER_YEAR } from '@/lib/constants/assumptions';
import type { NetWorthPoint, SimulationInput } from '@/types';
import { calculateAnnualExpenses } from './expenses';
import { calculateAnnualIncome } from './income';
import { toFiniteInt } from './utils';

/**
 * 연도별 순자산 timeline.
 *
 * 자산과 부채를 따로 굴리고 마지막에 뺀다:
 *
 *   assets(t) = assets(t-1) + surplus(t)
 *   debt(t)   = debt(t-1) - debtPaid(t)
 *   netWorth  = assets - debt
 *
 * 대출 상환은 **전액 원금 상환**으로 가정한다(이자 미반영, UI에 명시).
 * 상환액 x는 현금 -x, 부채 -x라 순자산에 중립이며, 부채가 소진된 해부터는
 * 상환액이 0이 되어 그만큼 잉여현금이 늘어난다.
 *
 * 잉여현금이 음수여도 0으로 막지 않는다. 자산이 줄어드는 것을 그대로 보여준다.
 */
export function calculateNetWorthTimeline(
  input: SimulationInput,
): NetWorthPoint[] {
  const points: NetWorthPoint[] = [];

  let assets = toFiniteInt(input.currentAssets);
  let debt = Math.max(0, toFiniteInt(input.currentDebt));

  points.push({
    t: 0,
    age: input.age,
    assets,
    debt,
    netWorth: assets - debt,
    surplus: 0,
    debtPaid: 0,
  });

  const annualDebtPayment = Math.max(
    0,
    toFiniteInt(input.debtPaymentMonthly) * MONTHS_PER_YEAR,
  );

  for (let t = 1; t <= input.years; t += 1) {
    // 잔여 부채를 넘겨 갚지 않는다 → 부채가 음수로 내려가지 않는다
    const debtPaid = Math.min(annualDebtPayment, debt);

    const { net } = calculateAnnualIncome(input, t);
    const surplus = net - calculateAnnualExpenses(input, debtPaid);

    assets = toFiniteInt(assets + surplus);
    debt = toFiniteInt(debt - debtPaid);

    points.push({
      t,
      age: input.age + t,
      assets,
      debt,
      netWorth: assets - debt,
      surplus,
      debtPaid,
    });
  }

  return points;
}

/** 특정 연차의 순자산. 범위를 벗어나면 마지막 값 */
export function netWorthAtYear(
  timeline: NetWorthPoint[],
  year: number,
): number {
  if (timeline.length === 0) return 0;
  const point = timeline.find((p) => p.t === year);
  return point ? point.netWorth : timeline[timeline.length - 1].netWorth;
}
