/**
 * 시뮬레이션 가정값의 단일 출처.
 *
 * CLAUDE.md 개발 원칙: "미래 계산의 가정값은 한 곳에서 수정 가능하도록 관리한다."
 * 계산 함수와 UI 어디에서도 숫자 리터럴 가정값을 쓰지 않는다. 전부 여기서 import 한다.
 */

/** 시뮬레이션 기간(년). 차트 포인트는 t=0..SIMULATION_YEARS로 11개 */
export const SIMULATION_YEARS = 10;

/** 중간 마일스톤(년) */
export const MILESTONE_SHORT_YEARS = 5;
export const MILESTONE_LONG_YEARS = 10;

/** 기본 연봉 상승률 (연 3%) */
export const DEFAULT_SALARY_GROWTH_RATE = 0.03;

/**
 * 투자수익률. MVP에서는 사용하지 않는다(0).
 * 0이 아닌 값을 쓰려면 UI에 "연 N% 수익 가정"을 반드시 노출해야 한다.
 */
export const DEFAULT_INVESTMENT_RETURN = 0;

/** 연간 실근무 주 수. 통근시간 계산용 */
export const WORKING_WEEKS_PER_YEAR = 48;

export const MONTHS_PER_YEAR = 12;

/** 이 금액 미만의 자산 차이는 "크지 않다"고 표현한다 */
export const MATERIAL_DIFF_THRESHOLD = 1_000_000;

/**
 * 세후 소득 추정용 **한계** 공제율 구간(소득세 + 4대보험 근사).
 *
 * 정교한 세법 구현이 아니다(CLAUDE.md 8.4 "너무 정교하게 만들 필요 없다").
 *
 * - 단일 고정 세율을 쓰지 않는 이유: 연봉이 올라도 공제율이 그대로면
 *   이직 비교에서 고연봉의 세부담 증가가 전혀 드러나지 않는다.
 * - 구간별 "정액" 세율(연봉 전체에 한 세율 적용)을 쓰지 않는 이유: 경계에서
 *   실수령액이 역전된다. 3,000만원은 11%로 2,670만원인데 3,000만 1원은 15%가
 *   적용돼 2,550만원이 되어, 연봉이 오르는데 손에 쥐는 돈이 줄어든다.
 *
 * 따라서 각 구간에 **해당 구간에 속한 금액분만** 공제율을 적용한다(누진).
 * 단조 증가가 보장되고, 실제 한국 소득세 구조와도 방향이 같다.
 */
export const MARGINAL_DEDUCTION_BRACKETS: ReadonlyArray<{
  upTo: number;
  rate: number;
}> = [
  { upTo: 30_000_000, rate: 0.12 },
  { upTo: 50_000_000, rate: 0.18 },
  { upTo: 80_000_000, rate: 0.24 },
  { upTo: 120_000_000, rate: 0.3 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.35 },
];

/**
 * UI에 노출해야 하는 고정 문구.
 * CLAUDE.md §10 / §14가 요구하는 문장이라 코드 곳곳에 흩어지지 않게 여기 모은다.
 */
export const ASSUMPTION_NOTES = {
  /** 모든 시뮬레이션 결과 화면 하단에 필수 */
  disclaimer:
    '본 결과는 입력한 정보와 가정에 기반한 시뮬레이션이며 실제 미래 결과를 보장하지 않습니다.',
  salaryGrowth: `연 ${(DEFAULT_SALARY_GROWTH_RATE * 100).toFixed(0)}% 연봉 상승 가정`,
  investment: '투자수익 미반영',
  debt: '대출 상환액은 전액 원금 상환으로 가정하며 이자는 반영하지 않습니다.',
  tax: '소득세·4대보험을 단순 근사한 추정값입니다.',
  /** 회사 평균급여를 노출하는 모든 지점에 필수 (도메인 경고 #2) */
  companyAverage:
    '공시된 회사 전체 직원 평균으로, 직급·직군별 실제 급여와 차이가 있을 수 있습니다.',
  commuteCost: '출근일을 바꾸면 월 교통비도 직접 조정하세요.',
} as const;

/** Summary 카드 하단에 한 줄로 붙이는 가정 요약 */
export const ASSUMPTION_SUMMARY_LINE = [
  ASSUMPTION_NOTES.salaryGrowth,
  ASSUMPTION_NOTES.investment,
  '대출 상환액은 전액 원금 상환으로 가정',
].join(' · ');
