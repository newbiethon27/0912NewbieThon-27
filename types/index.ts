/**
 * LifePath 도메인 타입.
 * 모든 금액은 원(KRW) 정수다. 만원/억 변환은 표시 시점(lib/format.ts)에서만 한다.
 */

/** 원(KRW) 정수 */
export type Won = number;

// ---------------------------------------------------------------------------
// DB entity
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  userId: string;
  age: number;
  residence: string;
  currentAssets: Won;
  currentDebt: Won;
  householdType: string | null;
  /** companies 테이블 FK. mock/DART 목록에 없는 회사면 null */
  currentCompanyId: string | null;
  /** 자유 입력 회사명. 목록에서 고른 경우에도 표시용으로 보관 */
  currentCompanyName: string | null;
  jobRole: string;
  /** 세전 연봉 */
  annualSalary: Won;
  yearsAtCompany: number;
  workLocation: string;
  officeDaysPerWeek: number;
  /** 하루 왕복 통근 분 */
  commuteMinutesPerDay: number;
  housingCostMonthly: Won;
  livingCostMonthly: Won;
  transportationCostMonthly: Won;
  insuranceCostMonthly: Won;
  debtPaymentMonthly: Won;
  savingsMonthly: Won;
}

export interface Company {
  id: string;
  name: string;
  dartCorpCode: string | null;
  /**
   * 공시된 회사 전체 직원 1인 평균 급여액.
   * 개인의 예상 연봉으로 직접 사용하지 않는다 (CLAUDE.md 도메인 경고 #2).
   */
  averageSalary: Won | null;
  averageTenure: number | null;
  employeeCount: number | null;
  dataYear: number | null;
  /** true면 개발/데모용 mock 데이터. UI에 배지를 노출해야 한다 */
  isMock: boolean;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  targetAge: number;
  targetNetWorth: Won;
}

// ---------------------------------------------------------------------------
// 시뮬레이션 입출력
// ---------------------------------------------------------------------------

/**
 * 계산 엔진의 입력. DB 스키마와 분리해 두어 Compare 화면에서
 * 사용자가 수정한 값으로 자유롭게 조립할 수 있게 한다.
 */
export interface SimulationInput {
  age: number;
  currentAssets: Won;
  currentDebt: Won;
  /** 세전 연봉 */
  annualSalary: Won;
  officeDaysPerWeek: number;
  /** 하루 왕복 통근 분 */
  commuteMinutesPerDay: number;
  housingCostMonthly: Won;
  livingCostMonthly: Won;
  transportationCostMonthly: Won;
  insuranceCostMonthly: Won;
  debtPaymentMonthly: Won;
  /** 순자산 계산에는 쓰지 않는다. 저축률 표시와 정합성 경고 전용 */
  savingsMonthly: Won;
  /** 소수 표기 (연 3% → 0.03) */
  salaryGrowthRate: number;
  /** 시뮬레이션 기간(년) */
  years: number;
}

/** t=0은 "현재", t>=1은 "앞으로 t번째 해" */
export interface IncomePoint {
  t: number;
  age: number;
  /** 세전 연봉 */
  gross: Won;
  /** 추정 세후 소득 */
  net: Won;
}

export interface NetWorthPoint {
  t: number;
  age: number;
  assets: Won;
  debt: Won;
  netWorth: Won;
  /** 해당 연도 잉여현금. 음수 가능 */
  surplus: Won;
  /** 해당 연도 실제 상환액 (잔여 부채를 넘지 않음) */
  debtPaid: Won;
}

export type GoalResult =
  | { status: 'already_achieved'; age: number; months: 0 }
  | {
      status: 'achieved';
      age: number;
      months: number;
      /** 목표 나이 대비 개월 차이. 양수면 목표보다 늦음 */
      vsTargetMonths: number;
    }
  | { status: 'not_reached' };

export interface MilestoneAmounts {
  fiveYear: Won;
  tenYear: Won;
}

export interface SimulationResult {
  /** 차트 범례와 카드 제목에 쓰는 시나리오 이름 */
  label: string;
  input: SimulationInput;
  income: IncomePoint[];
  netWorth: NetWorthPoint[];
  /** t=1..N 합계 (t=0은 이미 지난 시점이라 제외) */
  cumulativeGrossIncome: MilestoneAmounts;
  cumulativeNetIncome: MilestoneAmounts;
  netWorthAt: MilestoneAmounts;
  commuteHours: { annual: number; cumulative: number };
  commuteCost: { annual: Won; cumulative: Won };
  /** 세후 소득이 0이면 계산 불가라 null */
  savingsRate: number | null;
  goal: GoalResult | null;
}

/** Compare 화면에서 사용자가 직접 수정할 수 있는 4개 필드 */
export interface ScenarioInput {
  companyId: string | null;
  companyName: string;
  annualSalary: Won;
  officeDaysPerWeek: number;
  commuteMinutesPerDay: number;
  transportationCostMonthly: Won;
}

export interface ComparisonResult {
  current: SimulationResult;
  alternative: SimulationResult;
  /** alternative - current */
  diff: {
    cumulativeGrossIncomeTenYear: Won;
    cumulativeNetIncomeTenYear: Won;
    netWorthTenYear: Won;
    commuteHoursCumulative: number;
    commuteCostCumulative: Won;
  };
  /** 목표 달성 시점 차이(개월). 음수면 이직이 더 빠름. 한쪽이라도 미달성이면 null */
  goalDiffMonths: number | null;
  /** deterministic 규칙으로 생성한 요약 문장 */
  summary: string;
}
