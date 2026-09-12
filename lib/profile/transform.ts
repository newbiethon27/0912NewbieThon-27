import {
  DEFAULT_SALARY_GROWTH_RATE,
  SIMULATION_YEARS,
} from '@/lib/constants/assumptions';
import {
  manToWon,
  wonToMan,
  type OnboardingValues,
  type ScenarioValues,
} from '@/lib/validation/schemas';
import type { SimulationInput, UserProfile } from '@/types';

/**
 * 폼 값 · DB 프로필 ↔ 시뮬레이션 입력 변환.
 *
 * 계산 엔진(lib/simulation)을 폼/DB 형태와 분리해 두기 위한 경계다.
 * 컴포넌트가 직접 단위 변환이나 산수를 하지 않도록 여기서 모두 처리한다.
 */

/** 입력 중에는 NaN이 들어올 수 있으므로 안전하게 숫자로 만든다 */
function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 만원 단위 폼 값 → 원 */
function money(value: unknown): number {
  return manToWon(num(value));
}

/** 온보딩 폼 값(만원 단위) → 시뮬레이션 입력(원 단위) */
export function onboardingValuesToSimulationInput(
  values: OnboardingValues,
): SimulationInput {
  return {
    age: num(values.age),
    currentAssets: money(values.currentAssetsMan),
    currentDebt: money(values.currentDebtMan),
    annualSalary: money(values.annualSalaryMan),
    officeDaysPerWeek: num(values.officeDaysPerWeek),
    commuteMinutesPerDay: num(values.commuteMinutesPerDay),
    housingCostMonthly: money(values.housingCostMan),
    livingCostMonthly: money(values.livingCostMan),
    transportationCostMonthly: money(values.transportationCostMan),
    insuranceCostMonthly: money(values.insuranceCostMan),
    debtPaymentMonthly: money(values.debtPaymentMan),
    savingsMonthly: money(values.savingsMan),
    salaryGrowthRate: DEFAULT_SALARY_GROWTH_RATE,
    years: SIMULATION_YEARS,
  };
}

/** DB 프로필 → 시뮬레이션 입력. overrides로 이직 시나리오 값을 덮어쓴다 */
export function profileToSimulationInput(
  profile: UserProfile,
  overrides: Partial<SimulationInput> = {},
): SimulationInput {
  return {
    age: profile.age,
    currentAssets: profile.currentAssets,
    currentDebt: profile.currentDebt,
    annualSalary: profile.annualSalary,
    officeDaysPerWeek: profile.officeDaysPerWeek,
    commuteMinutesPerDay: profile.commuteMinutesPerDay,
    housingCostMonthly: profile.housingCostMonthly,
    livingCostMonthly: profile.livingCostMonthly,
    transportationCostMonthly: profile.transportationCostMonthly,
    insuranceCostMonthly: profile.insuranceCostMonthly,
    debtPaymentMonthly: profile.debtPaymentMonthly,
    savingsMonthly: profile.savingsMonthly,
    salaryGrowthRate: DEFAULT_SALARY_GROWTH_RATE,
    years: SIMULATION_YEARS,
    ...overrides,
  };
}

/**
 * Compare 폼 값 → 시뮬레이션 입력 덮어쓰기.
 *
 * 이직 시나리오에서 달라지는 값은 4개뿐이다.
 * 주거비·생활비·보험료·대출상환액과 연봉 상승률은 현재와 동일하다고 가정한다.
 */
export function scenarioValuesToOverrides(
  values: ScenarioValues,
): Partial<SimulationInput> {
  return {
    annualSalary: money(values.annualSalaryMan),
    officeDaysPerWeek: num(values.officeDaysPerWeek),
    commuteMinutesPerDay: num(values.commuteMinutesPerDay),
    transportationCostMonthly: money(values.transportationCostMan),
  };
}

/** 프로필 값을 Compare 폼의 초기값(만원 단위)으로 */
export function profileToScenarioValues(profile: UserProfile): ScenarioValues {
  return {
    // 회사 평균급여를 자동으로 넣지 않는다. 현재 연봉을 출발점으로 준다.
    annualSalaryMan: wonToMan(profile.annualSalary),
    officeDaysPerWeek: profile.officeDaysPerWeek,
    commuteMinutesPerDay: profile.commuteMinutesPerDay,
    transportationCostMan: wonToMan(profile.transportationCostMonthly),
  };
}

/** 기존 프로필을 온보딩/설정 폼의 기본값(만원 단위)으로 되돌린다 */
export function profileToFormValues(
  profile: UserProfile,
): Omit<OnboardingValues, 'targetAge' | 'targetNetWorthMan'> {
  return {
    age: profile.age,
    residence: profile.residence,
    currentAssetsMan: wonToMan(profile.currentAssets),
    currentDebtMan: wonToMan(profile.currentDebt),
    householdType: profile.householdType ?? '',
    currentCompanyId: profile.currentCompanyId,
    currentCompanyName: profile.currentCompanyName ?? '',
    jobRole: profile.jobRole,
    annualSalaryMan: wonToMan(profile.annualSalary),
    yearsAtCompany: profile.yearsAtCompany,
    workLocation: profile.workLocation,
    officeDaysPerWeek: profile.officeDaysPerWeek,
    commuteMinutesPerDay: profile.commuteMinutesPerDay,
    housingCostMan: wonToMan(profile.housingCostMonthly),
    livingCostMan: wonToMan(profile.livingCostMonthly),
    transportationCostMan: wonToMan(profile.transportationCostMonthly),
    insuranceCostMan: wonToMan(profile.insuranceCostMonthly),
    debtPaymentMan: wonToMan(profile.debtPaymentMonthly),
    savingsMan: wonToMan(profile.savingsMonthly),
  };
}

/** 온보딩 폼 값 → user_profiles insert/update payload (원 단위, snake_case) */
export function onboardingValuesToProfileRow(
  values: OnboardingValues,
  userId: string,
) {
  return {
    user_id: userId,
    age: num(values.age),
    residence: values.residence,
    current_assets: money(values.currentAssetsMan),
    current_debt: money(values.currentDebtMan),
    household_type: values.householdType || null,
    current_company_id: values.currentCompanyId,
    current_company_name: values.currentCompanyName,
    job_role: values.jobRole,
    annual_salary: money(values.annualSalaryMan),
    years_at_company: num(values.yearsAtCompany),
    work_location: values.workLocation,
    office_days_per_week: num(values.officeDaysPerWeek),
    commute_minutes_per_day: num(values.commuteMinutesPerDay),
    housing_cost_monthly: money(values.housingCostMan),
    living_cost_monthly: money(values.livingCostMan),
    transportation_cost_monthly: money(values.transportationCostMan),
    insurance_cost_monthly: money(values.insuranceCostMan),
    debt_payment_monthly: money(values.debtPaymentMan),
    savings_monthly: money(values.savingsMan),
  };
}
