'use client';

import type { UseFormReturn } from 'react-hook-form';
import { MoneyField, NumberField } from '@/components/forms/fields';
import { ASSUMPTION_NOTES } from '@/lib/constants/assumptions';
import type { ScenarioValues } from '@/lib/validation/schemas';

/**
 * 이직 시나리오 조건 입력.
 *
 * 예상 연봉은 사용자가 직접 넣는다. 회사 공시 평균급여를 개인의 예상 연봉으로
 * 자동 적용하지 않는다(CLAUDE.md 도메인 경고 #2).
 */
export function ScenarioInputForm({
  form,
}: {
  form: UseFormReturn<ScenarioValues>;
}) {
  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <MoneyField
        id="scenario-salary"
        label="예상 연봉 (세전)"
        hint="직접 입력하세요. 회사 평균급여가 자동으로 적용되지 않습니다."
        registration={register('annualSalaryMan', { valueAsNumber: true })}
        error={errors.annualSalaryMan?.message}
      />
      <NumberField
        id="scenario-office-days"
        label="예상 주당 출근일"
        suffix="일"
        min={0}
        max={7}
        registration={register('officeDaysPerWeek', { valueAsNumber: true })}
        error={errors.officeDaysPerWeek?.message}
      />
      <NumberField
        id="scenario-commute"
        label="예상 왕복 통근시간"
        suffix="분"
        registration={register('commuteMinutesPerDay', { valueAsNumber: true })}
        error={errors.commuteMinutesPerDay?.message}
      />
      <MoneyField
        id="scenario-transport"
        label="예상 월 교통비"
        hint={ASSUMPTION_NOTES.commuteCost}
        registration={register('transportationCostMan', {
          valueAsNumber: true,
        })}
        error={errors.transportationCostMan?.message}
      />
    </div>
  );
}
