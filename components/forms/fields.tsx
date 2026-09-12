'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BaseFieldProps {
  label: string;
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
  hint?: string;
  placeholder?: string;
}

function FieldShell({
  label,
  id,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export function TextField({
  label,
  id,
  registration,
  error,
  hint,
  placeholder,
}: BaseFieldProps) {
  return (
    <FieldShell label={label} id={id} hint={hint} error={error}>
      <Input
        id={id}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        {...registration}
      />
    </FieldShell>
  );
}

interface NumberFieldProps extends BaseFieldProps {
  /** 입력창 오른쪽에 붙는 단위 (예: "만원", "분", "일") */
  suffix?: string;
  step?: string;
  min?: number;
  max?: number;
}

export function NumberField({
  label,
  id,
  registration,
  error,
  hint,
  placeholder,
  suffix,
  step,
  min,
  max,
}: NumberFieldProps) {
  return (
    <FieldShell label={label} id={id} hint={hint} error={error}>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={suffix ? 'pr-12' : undefined}
          {...registration}
        />
        {suffix && (
          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
            {suffix}
          </span>
        )}
      </div>
    </FieldShell>
  );
}

/** 금액 필드는 전부 만원 단위로 입력받는다 */
export function MoneyField(props: Omit<NumberFieldProps, 'suffix'>) {
  return <NumberField {...props} suffix="만원" step="1" min={0} />;
}
