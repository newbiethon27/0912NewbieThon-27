import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SALARY_GROWTH_RATE,
  MILESTONE_LONG_YEARS,
  SIMULATION_YEARS,
} from '@/lib/constants/assumptions';
import type { NetWorthPoint, SimulationInput } from '@/types';
import {
  calculateAnnualExpenses,
  calculateCommuteCost,
  calculateCommuteHours,
  calculateGoalAchievementAge,
  calculateGrossSalary,
  calculateIncomeTimeline,
  calculateNetWorthTimeline,
  compareScenarios,
  estimateNetIncome,
  runSimulation,
} from './index';

const BASE: SimulationInput = {
  age: 30,
  currentAssets: 50_000_000,
  currentDebt: 0,
  annualSalary: 55_000_000,
  officeDaysPerWeek: 5,
  commuteMinutesPerDay: 80,
  housingCostMonthly: 700_000,
  livingCostMonthly: 900_000,
  transportationCostMonthly: 150_000,
  insuranceCostMonthly: 150_000,
  debtPaymentMonthly: 0,
  savingsMonthly: 1_500_000,
  salaryGrowthRate: DEFAULT_SALARY_GROWTH_RATE,
  years: SIMULATION_YEARS,
};

const input = (overrides: Partial<SimulationInput> = {}): SimulationInput => ({
  ...BASE,
  ...overrides,
});

function point(t: number, netWorth: number): NetWorthPoint {
  return {
    t,
    age: 30 + t,
    assets: netWorth,
    debt: 0,
    netWorth,
    surplus: 0,
    debtPaid: 0,
  };
}

// ---------------------------------------------------------------------------

describe('시간축 규약', () => {
  it('t=0..10으로 11개 포인트를 만든다', () => {
    expect(calculateIncomeTimeline(input())).toHaveLength(SIMULATION_YEARS + 1);
    expect(calculateNetWorthTimeline(input())).toHaveLength(
      SIMULATION_YEARS + 1,
    );
  });

  it('t=0은 현재 나이와 현재 순자산을 그대로 쓴다', () => {
    const timeline = calculateNetWorthTimeline(
      input({ currentAssets: 50_000_000, currentDebt: 20_000_000 }),
    );
    expect(timeline[0].age).toBe(30);
    expect(timeline[0].netWorth).toBe(30_000_000);
    expect(timeline[0].surplus).toBe(0);
  });

  it('1년차에는 아직 연봉 인상이 붙지 않는다', () => {
    expect(calculateGrossSalary(input(), 0)).toBe(55_000_000);
    expect(calculateGrossSalary(input(), 1)).toBe(55_000_000);
  });

  it('3년차 연봉은 상승률이 2회 적용된다', () => {
    expect(calculateGrossSalary(input(), 3)).toBe(
      Math.round(55_000_000 * 1.03 ** 2),
    );
  });

  it('누적 소득은 t=1..10 합이며 t=0을 포함하지 않는다', () => {
    const result = runSimulation({ label: '현재', input: input() });
    const fromOne = result.income
      .filter((p) => p.t >= 1 && p.t <= MILESTONE_LONG_YEARS)
      .reduce((sum, p) => sum + p.gross, 0);
    const allEleven = result.income.reduce((sum, p) => sum + p.gross, 0);

    expect(result.cumulativeGrossIncome.tenYear).toBe(fromOne);
    expect(result.cumulativeGrossIncome.tenYear).not.toBe(allEleven);
  });
});

describe('세후 소득 추정', () => {
  it('한계 누진이라 구간 경계에서 역전되지 않는다', () => {
    for (const boundary of [30_000_000, 50_000_000, 80_000_000, 120_000_000]) {
      expect(estimateNetIncome(boundary + 1)).toBeGreaterThanOrEqual(
        estimateNetIncome(boundary),
      );
    }
  });

  it('연봉 전 구간에서 단조 증가한다', () => {
    let previous = -1;
    for (let gross = 0; gross <= 200_000_000; gross += 1_000_000) {
      const net = estimateNetIncome(gross);
      expect(net).toBeGreaterThan(previous);
      previous = net;
    }
  });

  it('5,500만원의 세후 추정값은 4,660만원이다', () => {
    expect(estimateNetIncome(55_000_000)).toBe(46_600_000);
  });

  it('0 이하는 0으로 처리한다', () => {
    expect(estimateNetIncome(0)).toBe(0);
    expect(estimateNetIncome(-1_000)).toBe(0);
    expect(estimateNetIncome(Number.NaN)).toBe(0);
  });
});

describe('대출 상환', () => {
  const debtFree = input();
  const withDebt = input({
    currentDebt: 24_000_000,
    debtPaymentMonthly: 1_000_000, // 연 1,200만원 → 2년이면 완제
  });

  it('상환은 순자산에 중립이다 (현금 -x, 부채 -x)', () => {
    const a = calculateNetWorthTimeline(debtFree);
    const b = calculateNetWorthTimeline(withDebt);

    // 초기 부채만큼의 격차가 모든 연차에서 그대로 유지된다
    for (let t = 0; t <= SIMULATION_YEARS; t += 1) {
      expect(b[t].netWorth).toBe(a[t].netWorth - 24_000_000);
    }
  });

  it('부채가 소진되면 상환액이 0이 되고 잉여현금으로 전환된다', () => {
    const timeline = calculateNetWorthTimeline(withDebt);
    const debtFreeTimeline = calculateNetWorthTimeline(debtFree);

    expect(timeline[1].debtPaid).toBe(12_000_000);
    expect(timeline[2].debtPaid).toBe(12_000_000);
    expect(timeline[2].debt).toBe(0);
    expect(timeline[3].debtPaid).toBe(0);
    expect(timeline[3].surplus).toBe(debtFreeTimeline[3].surplus);
  });

  it('잔여 부채보다 많이 갚지 않아 부채가 음수가 되지 않는다', () => {
    const timeline = calculateNetWorthTimeline(
      input({ currentDebt: 5_000_000, debtPaymentMonthly: 1_000_000 }),
    );
    expect(timeline[1].debtPaid).toBe(5_000_000);
    for (const p of timeline) expect(p.debt).toBeGreaterThanOrEqual(0);
  });
});

describe('이중 계산 방지', () => {
  it('월 저축액을 바꿔도 순자산 timeline은 변하지 않는다', () => {
    const low = calculateNetWorthTimeline(input({ savingsMonthly: 0 }));
    const high = calculateNetWorthTimeline(
      input({ savingsMonthly: 3_000_000 }),
    );
    expect(high).toEqual(low);
  });

  it('교통비는 연간 지출에 정확히 한 번만 반영된다', () => {
    const withoutTransport = calculateAnnualExpenses(
      input({ transportationCostMonthly: 0 }),
      0,
    );
    const withTransport = calculateAnnualExpenses(
      input({ transportationCostMonthly: 150_000 }),
      0,
    );
    expect(withTransport - withoutTransport).toBe(150_000 * 12);
  });

  it('통근 교통비 지표는 지출과 같은 필드에서 파생된다', () => {
    expect(calculateCommuteCost(input()).annual).toBe(150_000 * 12);
    expect(calculateCommuteCost(input()).cumulative).toBe(150_000 * 12 * 10);
  });

  it('통근시간은 왕복 분 × 출근일 × 주 수 / 60 이다', () => {
    const hours = calculateCommuteHours(input());
    expect(hours.annual).toBeCloseTo((80 * 5 * 48) / 60, 6);
    expect(hours.cumulative).toBeCloseTo(hours.annual * 10, 6);
  });
});

describe('목표 달성 시점', () => {
  const timeline = [point(0, 0), point(1, 12_000_000), point(2, 24_000_000)];

  it('현재 이미 달성했으면 already_achieved', () => {
    const result = calculateGoalAchievementAge(
      [point(0, 50_000_000), point(1, 60_000_000)],
      { targetAge: 35, targetNetWorth: 30_000_000 },
      30,
    );
    expect(result).toEqual({ status: 'already_achieved', age: 30, months: 0 });
  });

  it('구간 사이는 월 단위로 선형 보간한다', () => {
    const result = calculateGoalAchievementAge(
      timeline,
      { targetAge: 32, targetNetWorth: 15_000_000 },
      30,
    );
    // 31세 시점 1,200만 → 32세 시점 2,400만. 1,500만은 25% 지점 = 3개월
    expect(result).toMatchObject({ status: 'achieved', age: 31, months: 3 });
  });

  it('목표 나이 대비 차이를 개월로 알려준다', () => {
    const result = calculateGoalAchievementAge(
      timeline,
      { targetAge: 31, targetNetWorth: 15_000_000 },
      30,
    );
    // 31세 3개월 달성, 목표는 31세 → 3개월 늦음
    expect(result).toMatchObject({ vsTargetMonths: 3 });
  });

  it('반올림으로 12개월이 되면 나이를 올린다', () => {
    const result = calculateGoalAchievementAge(
      timeline,
      { targetAge: 32, targetNetWorth: 23_760_000 },
      30,
    );
    expect(result).toMatchObject({ status: 'achieved', age: 32, months: 0 });
  });

  it('기간 내 미달성이면 외삽하지 않는다', () => {
    const result = calculateGoalAchievementAge(
      timeline,
      { targetAge: 32, targetNetWorth: 1_000_000_000 },
      30,
    );
    expect(result).toEqual({ status: 'not_reached' });
  });

  it('순자산이 감소하는 구간이 있어도 0으로 나누지 않는다', () => {
    const dip = [point(0, 0), point(1, -5_000_000), point(2, 10_000_000)];
    const result = calculateGoalAchievementAge(
      dip,
      { targetAge: 35, targetNetWorth: 5_000_000 },
      30,
    );
    expect(result.status).toBe('achieved');
    if (result.status === 'achieved') {
      expect(Number.isFinite(result.age)).toBe(true);
      expect(Number.isFinite(result.months)).toBe(true);
    }
  });
});

describe('경계값', () => {
  it('연봉 0이면 세후도 0이고 저축률은 계산 불가(null)', () => {
    const result = runSimulation({ label: '무소득', input: input({ annualSalary: 0 }) });
    expect(result.income[1].net).toBe(0);
    expect(result.savingsRate).toBeNull();
  });

  it('잉여현금이 음수면 0으로 막지 않고 자산이 줄어든다', () => {
    const timeline = calculateNetWorthTimeline(
      input({ annualSalary: 20_000_000, livingCostMonthly: 5_000_000 }),
    );
    expect(timeline[1].surplus).toBeLessThan(0);
    expect(timeline[1].assets).toBeLessThan(timeline[0].assets);
  });

  it('순자산이 음수로 내려가는 것을 허용한다', () => {
    const timeline = calculateNetWorthTimeline(
      input({
        currentAssets: 0,
        currentDebt: 30_000_000,
        annualSalary: 20_000_000,
        livingCostMonthly: 3_000_000,
      }),
    );
    expect(timeline[timeline.length - 1].netWorth).toBeLessThan(0);
  });

  it('모든 반환 숫자가 유한하다', () => {
    const result = runSimulation({
      label: '현재',
      input: input({ annualSalary: 0, currentAssets: 0, currentDebt: 0 }),
      goal: { targetAge: 40, targetNetWorth: 100_000_000 },
    });

    for (const p of result.income) {
      expect(Number.isFinite(p.gross)).toBe(true);
      expect(Number.isFinite(p.net)).toBe(true);
    }
    for (const p of result.netWorth) {
      expect(Number.isFinite(p.netWorth)).toBe(true);
      expect(Number.isFinite(p.assets)).toBe(true);
      expect(Number.isFinite(p.debt)).toBe(true);
      expect(Number.isFinite(p.surplus)).toBe(true);
    }
    expect(Number.isFinite(result.commuteHours.cumulative)).toBe(true);
    expect(Number.isFinite(result.commuteCost.cumulative)).toBe(true);
  });
});

describe('시나리오 비교', () => {
  const goal = { targetAge: 35, targetNetWorth: 200_000_000 };
  const current = runSimulation({ label: '현재 회사 유지', input: input(), goal });

  const run = (overrides: Partial<SimulationInput>) =>
    runSimulation({ label: '이직', input: input(overrides), goal });

  it('자산은 늘지만 통근이 늘면 대비 문장을 만든다', () => {
    const result = compareScenarios(
      current,
      run({ annualSalary: 70_000_000, commuteMinutesPerDay: 120 }),
    );
    expect(result.diff.netWorthTenYear).toBeGreaterThan(0);
    expect(result.diff.commuteHoursCumulative).toBeGreaterThan(0);
    expect(result.summary).toContain('추가 자산을 확보할 수 있지만');
    expect(result.summary).toContain('더 통근하게 됩니다');
  });

  it('자산도 늘고 통근도 줄면 둘 다 긍정으로 쓴다', () => {
    const result = compareScenarios(
      current,
      run({ annualSalary: 70_000_000, commuteMinutesPerDay: 40 }),
    );
    expect(result.summary).toContain('더 모으면서 통근시간도');
  });

  it('자산이 줄고 통근이 늘면 둘 다 부정으로 쓴다', () => {
    const result = compareScenarios(
      current,
      run({ annualSalary: 40_000_000, commuteMinutesPerDay: 120 }),
    );
    expect(result.diff.netWorthTenYear).toBeLessThan(0);
    expect(result.summary).toContain('줄고');
    expect(result.summary).toContain('늘어납니다');
  });

  it('자산 차이가 기준 미만이면 크지 않다고 표현한다', () => {
    const result = compareScenarios(current, run({}));
    expect(result.diff.netWorthTenYear).toBe(0);
    expect(result.summary).toContain('크지 않');
  });

  it('권유형 표현을 만들지 않는다', () => {
    const result = compareScenarios(current, run({ annualSalary: 90_000_000 }));
    for (const banned of ['이직하세요', '추천', '유리합니다', '낫습니다']) {
      expect(result.summary).not.toContain(banned);
    }
  });

  it('한쪽이라도 목표 미달성이면 달성 시점 차이를 계산하지 않는다', () => {
    const unreachable = runSimulation({
      label: '이직',
      input: input({ annualSalary: 20_000_000 }),
      goal: { targetAge: 35, targetNetWorth: 5_000_000_000 },
    });
    expect(compareScenarios(current, unreachable).goalDiffMonths).toBeNull();
  });
});
