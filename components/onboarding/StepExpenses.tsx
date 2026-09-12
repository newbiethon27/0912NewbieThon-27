'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MoneyField } from '@/components/forms/fields';
import { ASSUMPTION_NOTES } from '@/lib/constants/assumptions';
import { formatKRW } from '@/lib/format';
import { onboardingValuesToSimulationInput } from '@/lib/profile/transform';
import { monthlyNetIncome, monthlySurplus } from '@/lib/simulation';
import type { OnboardingValues } from '@/lib/validation/schemas';
import type { FieldErrorGetter } from './types';

export function StepExpenses({
  form,
  getError,
}: {
  form: UseFormReturn<OnboardingValues>;
  getError: FieldErrorGetter;
}) {
  const { register, watch } = form;

  // 계산은 전부 순수 함수에 맡긴다. 여기서 산수를 하지 않는다.
  const input = onboardingValuesToSimulationInput(watch());
  const monthlyNet = monthlyNetIncome(input);
  const surplus = monthlySurplus(input, monthlyNet);

  // 지출과 저축의 합이 세후소득을 넘으면 입력이 서로 맞지 않는다.
  const overCommitted = monthlyNet > 0 && input.savingsMonthly > surplus;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <MoneyField
          id="housingCostMan"
          label="월 주거비"
          placeholder="70"
          hint="월세·관리비 등"
          registration={register('housingCostMan', { valueAsNumber: true })}
          error={getError('housingCostMan')}
        />
        <MoneyField
          id="livingCostMan"
          label="월 생활비"
          placeholder="90"
          hint="식비·통신비·여가 등"
          registration={register('livingCostMan', { valueAsNumber: true })}
          error={getError('livingCostMan')}
        />
        <MoneyField
          id="transportationCostMan"
          label="월 교통비"
          placeholder="15"
          registration={register('transportationCostMan', {
            valueAsNumber: true,
          })}
          error={getError('transportationCostMan')}
        />
        <MoneyField
          id="insuranceCostMan"
          label="월 보험료"
          placeholder="15"
          registration={register('insuranceCostMan', { valueAsNumber: true })}
          error={getError('insuranceCostMan')}
        />
        <MoneyField
          id="debtPaymentMan"
          label="월 대출 상환액"
          placeholder="0"
          hint={ASSUMPTION_NOTES.debt}
          registration={register('debtPaymentMan', { valueAsNumber: true })}
          error={getError('debtPaymentMan')}
        />
        <MoneyField
          id="savingsMan"
          label="월 저축·투자액"
          placeholder="100"
          hint="실제로 매달 떼어 두는 금액"
          registration={register('savingsMan', { valueAsNumber: true })}
          error={getError('savingsMan')}
        />
      </div>

      <div className="bg-muted/40 rounded-lg border p-4">
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">월 예상 세후소득</dt>
            <dd className="mt-0.5 font-medium">{formatKRW(monthlyNet)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">월 고정 지출</dt>
            <dd className="mt-0.5 font-medium">
              {formatKRW(monthlyNet - surplus)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">월 잉여현금</dt>
            <dd
              className={`mt-0.5 font-medium ${surplus < 0 ? 'text-destructive' : ''}`}
            >
              {formatKRW(surplus)}
            </dd>
          </div>
        </dl>
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
          순자산은 이 잉여현금이 쌓여가는 것으로 계산합니다. 월 저축·투자액은
          저축률 표시에만 사용합니다. {ASSUMPTION_NOTES.tax}
        </p>
      </div>

      {overCommitted && (
        <Alert>
          <AlertDescription>
            입력한 지출과 저축의 합이 예상 세후소득을 초과합니다. 생활비를 다시
            확인해 주세요. 지출이 실제보다 적게 입력되면 미래 순자산이 과하게
            낙관적으로 계산됩니다.
          </AlertDescription>
        </Alert>
      )}

      {surplus < 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            현재 지출이 예상 세후소득을 초과해 매달 자산이 줄어드는 것으로
            계산됩니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
