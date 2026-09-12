'use client';

import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CompanyInfoCard } from '@/components/companies/CompanyInfoCard';
import { CompanySearch } from '@/components/companies/CompanySearch';
import { MoneyField, NumberField, TextField } from '@/components/forms/fields';
import { isMockCompanyId } from '@/lib/companies/mock';
import type { OnboardingValues } from '@/lib/validation/schemas';
import type { FieldErrorGetter } from './types';
import type { Company } from '@/types';

/** DB row에서 온 회사만 FK로 저장할 수 있다 */
function toStorableCompanyId(company: Company | null): string | null {
  if (!company) return null;
  if (isMockCompanyId(company.id)) return null;
  return company.id;
}

export function StepJobInfo({
  form,
  getError,
}: {
  form: UseFormReturn<OnboardingValues>;
  getError: FieldErrorGetter;
}) {
  const { register, watch, setValue } = form;
  const [selected, setSelected] = useState<Company | null>(null);

  const companyName = watch('currentCompanyName') ?? '';

  return (
    <div className="space-y-5">
      <CompanySearch
        label="현재 회사"
        value={companyName}
        allowFreeText
        hint="목록에 없으면 회사명을 직접 입력해도 됩니다."
        error={getError('currentCompanyName')}
        onChange={({ company, name }) => {
          setSelected(company);
          setValue('currentCompanyName', name, { shouldValidate: true });
          setValue('currentCompanyId', toStorableCompanyId(company));
        }}
      />

      {selected && <CompanyInfoCard company={selected} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="jobRole"
          label="직군"
          placeholder="백엔드 개발"
          registration={register('jobRole')}
          error={getError('jobRole')}
        />
        <MoneyField
          id="annualSalaryMan"
          label="현재 연봉 (세전)"
          placeholder="5500"
          hint="세금·4대보험을 떼기 전 금액"
          registration={register('annualSalaryMan', { valueAsNumber: true })}
          error={getError('annualSalaryMan')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          id="yearsAtCompany"
          label="현재 회사 근속기간"
          suffix="년"
          step="0.5"
          placeholder="2"
          registration={register('yearsAtCompany', { valueAsNumber: true })}
          error={getError('yearsAtCompany')}
        />
        <TextField
          id="workLocation"
          label="근무 지역"
          placeholder="서울 강남구"
          registration={register('workLocation')}
          error={getError('workLocation')}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <NumberField
          id="officeDaysPerWeek"
          label="주당 출근 횟수"
          suffix="일"
          min={0}
          max={7}
          placeholder="5"
          registration={register('officeDaysPerWeek', { valueAsNumber: true })}
          error={getError('officeDaysPerWeek')}
        />
        <NumberField
          id="commuteMinutesPerDay"
          label="하루 왕복 통근시간"
          suffix="분"
          placeholder="80"
          hint="집에서 회사까지 왕복에 걸리는 총 시간"
          registration={register('commuteMinutesPerDay', {
            valueAsNumber: true,
          })}
          error={getError('commuteMinutesPerDay')}
        />
      </div>
    </div>
  );
}
