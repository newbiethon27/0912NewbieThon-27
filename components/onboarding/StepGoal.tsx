'use client';

import type { UseFormReturn } from 'react-hook-form';
import { MoneyField, NumberField } from '@/components/forms/fields';
import { formatKRW } from '@/lib/format';
import { manToWon, type OnboardingValues } from '@/lib/validation/schemas';
import type { FieldErrorGetter } from './types';

export function StepGoal({
  form,
  getError,
}: {
  form: UseFormReturn<OnboardingValues>;
  getError: FieldErrorGetter;
}) {
  const { register, watch } = form;

  const targetAge = watch('targetAge');
  const targetMan = watch('targetNetWorthMan');
  const hasPreview =
    Number.isFinite(targetAge) && Number.isFinite(targetMan) && targetMan > 0;

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm leading-relaxed">
        언제까지 얼마를 모으고 싶은지 하나만 정해 주세요. 시뮬레이션이 이 목표에
        언제 도달하는지 계산해 드립니다.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          id="targetAge"
          label="목표 나이"
          suffix="세"
          placeholder="35"
          registration={register('targetAge', { valueAsNumber: true })}
          error={getError('targetAge')}
        />
        <MoneyField
          id="targetNetWorthMan"
          label="목표 순자산"
          placeholder="20000"
          hint="자산에서 부채를 뺀 금액 기준"
          registration={register('targetNetWorthMan', { valueAsNumber: true })}
          error={getError('targetNetWorthMan')}
        />
      </div>

      {hasPreview && (
        <div className="bg-muted/40 rounded-lg border p-4 text-sm">
          목표: <strong>{targetAge}세</strong>까지 순자산{' '}
          <strong>{formatKRW(manToWon(targetMan))}</strong>
        </div>
      )}
    </div>
  );
}
