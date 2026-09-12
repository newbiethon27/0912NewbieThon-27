'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { saveOnboarding } from '@/lib/profile/actions';
import {
  onboardingSchema,
  type OnboardingValues,
} from '@/lib/validation/schemas';
import { StepBasicInfo } from './StepBasicInfo';
import { StepExpenses } from './StepExpenses';
import { StepGoal } from './StepGoal';
import { StepJobInfo } from './StepJobInfo';

const STEPS = [
  {
    title: '기본 정보',
    description: '나이와 자산 상황을 알려주세요.',
    fields: [
      'age',
      'residence',
      'currentAssetsMan',
      'currentDebtMan',
      'householdType',
    ],
  },
  {
    title: '직업 정보',
    description: '현재 회사와 근무 조건을 입력해 주세요.',
    fields: [
      'currentCompanyName',
      'jobRole',
      'annualSalaryMan',
      'yearsAtCompany',
      'workLocation',
      'officeDaysPerWeek',
      'commuteMinutesPerDay',
    ],
  },
  {
    title: '월 생활비',
    description: '매달 나가는 돈을 입력해 주세요.',
    fields: [
      'housingCostMan',
      'livingCostMan',
      'transportationCostMan',
      'insuranceCostMan',
      'debtPaymentMan',
      'savingsMan',
    ],
  },
  {
    title: '재무 목표',
    description: '언제까지 얼마를 모으고 싶으신가요?',
    fields: ['targetAge', 'targetNetWorthMan'],
  },
] as const satisfies ReadonlyArray<{
  title: string;
  description: string;
  fields: ReadonlyArray<keyof OnboardingValues>;
}>;

const EMPTY_VALUES: OnboardingValues = {
  age: Number.NaN,
  residence: '',
  currentAssetsMan: Number.NaN,
  currentDebtMan: Number.NaN,
  householdType: '',
  currentCompanyId: null,
  currentCompanyName: '',
  jobRole: '',
  annualSalaryMan: Number.NaN,
  yearsAtCompany: Number.NaN,
  workLocation: '',
  officeDaysPerWeek: Number.NaN,
  commuteMinutesPerDay: Number.NaN,
  housingCostMan: Number.NaN,
  livingCostMan: Number.NaN,
  transportationCostMan: Number.NaN,
  insuranceCostMan: Number.NaN,
  debtPaymentMan: Number.NaN,
  savingsMan: Number.NaN,
  targetAge: Number.NaN,
  targetNetWorthMan: Number.NaN,
};

interface OnboardingFormProps {
  defaultValues?: Partial<OnboardingValues>;
  /** 설정 화면에서 재사용할 때 문구를 바꾼다 */
  mode?: 'onboarding' | 'settings';
}

export function OnboardingForm({
  defaultValues,
  mode = 'onboarding',
}: OnboardingFormProps) {
  const [step, setStep] = useState(0);
  /** "다음"을 눌렀지만 검증에 막힌 단계 — 이때부터 그 단계 에러를 보여준다 */
  const [blockedSteps, setBlockedSteps] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
    mode: 'onTouched',
  });

  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];

  /**
   * 아직 손대지도 않은 단계에 "숫자로 입력하세요" 에러가 미리 떠 있으면 안 된다.
   *
   * zodResolver는 스키마 전체를 검증하므로, 다음 버튼을 누르는 순간 직전 입력이
   * blur되며 도는 검증이 **다음 단계의 빈 필드까지** 에러로 잡는다.
   * 그 검증은 비동기라 clearErrors로 지워도 뒤늦게 도착해 다시 덮어쓴다.
   * 그래서 지우는 대신, 보여줄 조건을 좁힌다:
   * 사용자가 건드린 필드이거나, 그 단계에서 "다음"을 눌러 막힌 경우에만 표시한다.
   */
  const { errors, touchedFields, isSubmitted } = form.formState;

  function getError(name: keyof OnboardingValues): string | undefined {
    if (!isSubmitted && !blockedSteps.has(step) && !touchedFields[name]) {
      return undefined;
    }
    return errors[name]?.message;
  }

  async function goNext() {
    const valid = await form.trigger([...current.fields]);
    if (!valid) {
      // 왜 못 넘어가는지는 보여줘야 한다
      setBlockedSteps((prev) => new Set(prev).add(step));
      return;
    }
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function submit(values: OnboardingValues) {
    // 마지막 단계가 아니면 절대 저장하지 않는다 (Enter 키 등으로 새는 경로 차단)
    if (!isLastStep) return;
    setServerError(null);
    startTransition(async () => {
      // 성공하면 서버 액션이 /dashboard로 redirect 한다
      const result = await saveOnboarding(values);
      if (result?.error) setServerError(result.error);
      else if (result?.goalError) setServerError(result.goalError);
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === 'settings' ? '입력 정보 수정' : '시작하기'}
        </h1>
        <span className="text-muted-foreground text-sm">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <div className="mt-4 flex gap-1.5">
        {STEPS.map((item, index) => (
          <div
            key={item.title}
            className={`h-1 flex-1 rounded-full ${
              index <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium">{current.title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {current.description}
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(submit)}
        className="mt-8 space-y-8"
        noValidate
      >
        {step === 0 && <StepBasicInfo form={form} getError={getError} />}
        {step === 1 && <StepJobInfo form={form} getError={getError} />}
        {step === 2 && <StepExpenses form={form} getError={getError} />}
        {step === 3 && <StepGoal form={form} getError={getError} />}

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between gap-3 border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            className="h-10"
            disabled={step === 0 || isPending}
            onClick={() => setStep((value) => Math.max(value - 1, 0))}
          >
            이전
          </Button>

          {/*
            두 버튼을 조건부로 갈아끼우지 않는다. React가 같은 위치의 <button>
            DOM 노드를 재사용하기 때문에, "다음"을 누른 순간 setStep으로 리렌더되면
            그 노드가 type="submit"으로 바뀌고, 브라우저가 클릭의 기본 동작을
            수행하며 폼이 제출돼 버린다. 항상 type="button"으로 두고 제출은
            직접 호출한다.
          */}
          <Button
            type="button"
            className="h-10 px-6"
            onClick={isLastStep ? form.handleSubmit(submit) : goNext}
            disabled={isPending}
          >
            {isLastStep ? (isPending ? '저장 중…' : '저장하고 리포트 보기') : '다음'}
          </Button>
        </div>
      </form>
    </div>
  );
}
