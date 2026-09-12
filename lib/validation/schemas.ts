import { z } from 'zod';

/**
 * 폼 검증 스키마.
 *
 * 금액은 화면에서 **만원 단위**로 입력받는다(원 단위는 자릿수가 많아 오입력이 잦다).
 * DB에는 원 단위 정수로 저장하므로 제출 직전에 `manToWon()`으로 변환한다.
 */

export const MAN = 10_000;

export function manToWon(man: number): number {
  return Math.round(man * MAN);
}

export function wonToMan(won: number): number {
  return Math.round(won / MAN);
}

/**
 * 숫자 필드.
 *
 * `z.coerce`를 쓰지 않는다. coerce는 입력 타입이 `unknown`이라
 * react-hook-form의 폼 타입과 어긋난다. 대신 register에 `valueAsNumber: true`를
 * 주어 RHF가 숫자로 넘겨주게 하고, 여기서는 순수 number로 검증한다.
 * (빈 입력은 NaN이 되어 아래 메시지로 걸러진다)
 */
function numberField(label: string) {
  return z.number({ message: `${label}을(를) 숫자로 입력하세요.` });
}

/** 만원 단위 금액 필드 (0 이상) */
function moneyMan(label: string) {
  return numberField(label)
    .min(0, `${label}은(는) 0 이상이어야 합니다.`)
    .max(100_000_000, `${label} 값이 너무 큽니다.`);
}

// ---------------------------------------------------------------------------
// 인증
// ---------------------------------------------------------------------------

export const credentialsSchema = z.object({
  email: z.email({ message: '올바른 이메일 주소를 입력하세요.' }),
  password: z
    .string()
    .min(6, '비밀번호는 6자 이상이어야 합니다.')
    .max(72, '비밀번호가 너무 깁니다.'),
});

export type CredentialsValues = z.infer<typeof credentialsSchema>;

// ---------------------------------------------------------------------------
// 온보딩 Step 1~4
// ---------------------------------------------------------------------------

export const basicInfoSchema = z.object({
  age: numberField('나이')
    .int('나이는 정수로 입력하세요.')
    .min(15, '15세 이상만 입력할 수 있습니다.')
    .max(100, '100세 이하로 입력하세요.'),
  residence: z.string().trim().min(1, '거주지역을 입력하세요.'),
  currentAssetsMan: moneyMan('보유 자산'),
  currentDebtMan: moneyMan('부채'),
  householdType: z.string().trim(),
});

export const jobInfoSchema = z.object({
  currentCompanyId: z.uuid().nullable(),
  currentCompanyName: z.string().trim().min(1, '현재 회사를 입력하세요.'),
  jobRole: z.string().trim().min(1, '직군을 입력하세요.'),
  annualSalaryMan: moneyMan('연봉'),
  yearsAtCompany: numberField('근속기간')
    .min(0, '근속기간은 0 이상이어야 합니다.')
    .max(60, '근속기간이 너무 깁니다.'),
  workLocation: z.string().trim().min(1, '근무 지역을 입력하세요.'),
  officeDaysPerWeek: numberField('주당 출근 횟수')
    .int('주당 출근 횟수는 정수로 입력하세요.')
    .min(0, '0일 이상으로 입력하세요.')
    .max(7, '주당 출근 횟수는 7일을 넘을 수 없습니다.'),
  commuteMinutesPerDay: numberField('통근시간')
    .int('통근시간은 분 단위 정수로 입력하세요.')
    .min(0, '0분 이상으로 입력하세요.')
    .max(1440, '하루 통근시간이 24시간을 넘을 수 없습니다.'),
});

export const expensesSchema = z.object({
  housingCostMan: moneyMan('주거비'),
  livingCostMan: moneyMan('생활비'),
  transportationCostMan: moneyMan('교통비'),
  insuranceCostMan: moneyMan('보험료'),
  debtPaymentMan: moneyMan('대출 상환액'),
  savingsMan: moneyMan('월 저축·투자액'),
});

export const goalSchema = z.object({
  targetAge: numberField('목표 나이')
    .int('목표 나이는 정수로 입력하세요.')
    .min(15, '15세 이상으로 입력하세요.')
    .max(100, '100세 이하로 입력하세요.'),
  targetNetWorthMan: moneyMan('목표 순자산').refine(
    (value) => value > 0,
    '목표 순자산은 0보다 커야 합니다.',
  ),
});

/** 4단계를 합친 전체 온보딩 값 */
export const onboardingSchema = basicInfoSchema
  .extend(jobInfoSchema.shape)
  .extend(expensesSchema.shape)
  .extend(goalSchema.shape)
  .refine((values) => values.targetAge >= values.age, {
    message: '목표 나이는 현재 나이보다 같거나 커야 합니다.',
    path: ['targetAge'],
  });

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;
export type JobInfoValues = z.infer<typeof jobInfoSchema>;
export type ExpensesValues = z.infer<typeof expensesSchema>;
export type GoalValues = z.infer<typeof goalSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;

// ---------------------------------------------------------------------------
// Compare 시나리오 (사용자가 직접 수정하는 4개 필드)
// ---------------------------------------------------------------------------

export const scenarioSchema = z.object({
  annualSalaryMan: moneyMan('예상 연봉'),
  officeDaysPerWeek: numberField('주당 출근 횟수')
    .int('주당 출근 횟수는 정수로 입력하세요.')
    .min(0, '0일 이상으로 입력하세요.')
    .max(7, '주당 출근 횟수는 7일을 넘을 수 없습니다.'),
  commuteMinutesPerDay: numberField('통근시간')
    .int('통근시간은 분 단위 정수로 입력하세요.')
    .min(0, '0분 이상으로 입력하세요.')
    .max(1440, '하루 통근시간이 24시간을 넘을 수 없습니다.'),
  transportationCostMan: moneyMan('월 교통비'),
});

export type ScenarioValues = z.infer<typeof scenarioSchema>;
