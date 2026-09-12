import type { OnboardingValues } from '@/lib/validation/schemas';

/**
 * 필드 에러를 "보여줄지"까지 판단해서 돌려준다.
 * 아직 건드리지 않은 필드에는 에러를 띄우지 않는다(OnboardingForm 참고).
 */
export type FieldErrorGetter = (
  name: keyof OnboardingValues,
) => string | undefined;
