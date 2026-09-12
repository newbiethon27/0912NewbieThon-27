'use client';

import type { UseFormReturn } from 'react-hook-form';
import { MoneyField, NumberField, TextField } from '@/components/forms/fields';
import type { OnboardingValues } from '@/lib/validation/schemas';
import type { FieldErrorGetter } from './types';

export function StepBasicInfo({
  form,
  getError,
}: {
  form: UseFormReturn<OnboardingValues>;
  getError: FieldErrorGetter;
}) {
  const { register } = form;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          id="age"
          label="현재 나이"
          suffix="세"
          placeholder="30"
          registration={register('age', { valueAsNumber: true })}
          error={getError('age')}
        />
        <TextField
          id="residence"
          label="현재 거주지역"
          placeholder="서울 마포구"
          registration={register('residence')}
          error={getError('residence')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <MoneyField
          id="currentAssetsMan"
          label="현재 보유 자산"
          placeholder="5000"
          hint="예금·투자·부동산 등 현재 가진 자산의 합계"
          registration={register('currentAssetsMan', { valueAsNumber: true })}
          error={getError('currentAssetsMan')}
        />
        <MoneyField
          id="currentDebtMan"
          label="현재 부채"
          placeholder="0"
          hint="대출 잔액 등 갚아야 할 금액"
          registration={register('currentDebtMan', { valueAsNumber: true })}
          error={getError('currentDebtMan')}
        />
      </div>

      <TextField
        id="householdType"
        label="가구 형태 (선택)"
        placeholder="1인 가구"
        registration={register('householdType')}
        error={getError('householdType')}
      />
    </div>
  );
}
