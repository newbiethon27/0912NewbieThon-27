/**
 * DB row(snake_case) ↔ 도메인 타입(camelCase) 변환.
 * Supabase 타입 생성기를 쓰지 않으므로 row 형태를 여기서 명시한다.
 */

import type { Company, FinancialGoal, UserProfile } from '@/types';

export interface UserProfileRow {
  id: string;
  user_id: string;
  age: number;
  residence: string;
  current_assets: number;
  current_debt: number;
  household_type: string | null;
  current_company_id: string | null;
  current_company_name: string | null;
  job_role: string;
  annual_salary: number;
  years_at_company: number;
  work_location: string;
  office_days_per_week: number;
  commute_minutes_per_day: number;
  housing_cost_monthly: number;
  living_cost_monthly: number;
  transportation_cost_monthly: number;
  insurance_cost_monthly: number;
  debt_payment_monthly: number;
  savings_monthly: number;
}

export interface CompanyRow {
  id: string;
  name: string;
  dart_corp_code: string | null;
  average_salary: number | null;
  average_tenure: number | null;
  employee_count: number | null;
  data_year: number | null;
  is_mock: boolean;
}

export interface FinancialGoalRow {
  id: string;
  user_id: string;
  target_age: number;
  target_net_worth: number;
}

/** user_profiles 조회 시 사용할 컬럼 목록 */
export const USER_PROFILE_COLUMNS = `
  id, user_id, age, residence, current_assets, current_debt, household_type,
  current_company_id, current_company_name, job_role, annual_salary,
  years_at_company, work_location, office_days_per_week, commute_minutes_per_day,
  housing_cost_monthly, living_cost_monthly, transportation_cost_monthly,
  insurance_cost_monthly, debt_payment_monthly, savings_monthly
`;

export const COMPANY_COLUMNS = `
  id, name, dart_corp_code, average_salary, average_tenure,
  employee_count, data_year, is_mock
`;

export const FINANCIAL_GOAL_COLUMNS = 'id, user_id, target_age, target_net_worth';

export function toUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    age: row.age,
    residence: row.residence,
    currentAssets: row.current_assets,
    currentDebt: row.current_debt,
    householdType: row.household_type,
    currentCompanyId: row.current_company_id,
    currentCompanyName: row.current_company_name,
    jobRole: row.job_role,
    annualSalary: row.annual_salary,
    yearsAtCompany: row.years_at_company,
    workLocation: row.work_location,
    officeDaysPerWeek: row.office_days_per_week,
    commuteMinutesPerDay: row.commute_minutes_per_day,
    housingCostMonthly: row.housing_cost_monthly,
    livingCostMonthly: row.living_cost_monthly,
    transportationCostMonthly: row.transportation_cost_monthly,
    insuranceCostMonthly: row.insurance_cost_monthly,
    debtPaymentMonthly: row.debt_payment_monthly,
    savingsMonthly: row.savings_monthly,
  };
}

export function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    dartCorpCode: row.dart_corp_code,
    averageSalary: row.average_salary,
    averageTenure: row.average_tenure,
    employeeCount: row.employee_count,
    dataYear: row.data_year,
    isMock: row.is_mock,
  };
}

export function toFinancialGoal(row: FinancialGoalRow): FinancialGoal {
  return {
    id: row.id,
    userId: row.user_id,
    targetAge: row.target_age,
    targetNetWorth: row.target_net_worth,
  };
}
