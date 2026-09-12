import {
  MARGINAL_DEDUCTION_BRACKETS,
  MONTHS_PER_YEAR,
} from '@/lib/constants/assumptions';
import type { IncomePoint, SimulationInput, Won } from '@/types';
import { toFiniteInt } from './utils';

/**
 * 세전 연봉 → 추정 세후 소득.
 *
 * 한계 공제율 누진 방식이라 연봉에 대해 단조 증가한다.
 * 정교한 세법 계산이 아니며, UI에는 반드시 "추정값"으로 표기한다.
 */
export function estimateNetIncome(grossAnnual: number): Won {
  const gross = toFiniteInt(grossAnnual);
  if (gross <= 0) return 0;

  let deduction = 0;
  let lowerBound = 0;

  for (const bracket of MARGINAL_DEDUCTION_BRACKETS) {
    if (gross <= lowerBound) break;
    const taxableInBracket = Math.min(gross, bracket.upTo) - lowerBound;
    deduction += taxableInBracket * bracket.rate;
    lowerBound = bracket.upTo;
  }

  return toFiniteInt(gross - deduction);
}

/**
 * t년차의 세전 연봉.
 *
 * t=0은 "현재"라 인상이 없고, t=1(1년차)도 아직 인상이 적용되지 않는다.
 * 지수가 (t-1)인 이유: 가입 즉시 유령 인상이 붙는 것을 막는다.
 */
export function calculateGrossSalary(input: SimulationInput, t: number): Won {
  const base = toFiniteInt(input.annualSalary);
  if (t <= 1) return base;
  return toFiniteInt(base * Math.pow(1 + input.salaryGrowthRate, t - 1));
}

/** t년차의 세전/세후 소득 */
export function calculateAnnualIncome(
  input: SimulationInput,
  t: number,
): { gross: Won; net: Won } {
  const gross = calculateGrossSalary(input, t);
  return { gross, net: estimateNetIncome(gross) };
}

/** t=0..years, 총 years+1개 포인트 */
export function calculateIncomeTimeline(input: SimulationInput): IncomePoint[] {
  const points: IncomePoint[] = [];
  for (let t = 0; t <= input.years; t += 1) {
    const { gross, net } = calculateAnnualIncome(input, t);
    points.push({ t, age: input.age + t, gross, net });
  }
  return points;
}

/** 월 세후 소득. 저축률 계산용 */
export function monthlyNetIncome(input: SimulationInput): Won {
  return Math.round(calculateAnnualIncome(input, 1).net / MONTHS_PER_YEAR);
}
