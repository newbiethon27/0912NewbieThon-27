'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/dal';
import { createClient } from '@/lib/supabase/server';
import { manToWon, onboardingSchema } from '@/lib/validation/schemas';
import { onboardingValuesToProfileRow } from './transform';

export interface SaveProfileState {
  /** 프로필 저장 실패. 폼 값을 유지한 채 다시 시도하게 한다 */
  error?: string;
  /** 프로필은 저장됐지만 목표 저장만 실패한 경우 */
  goalError?: string;
}

/**
 * 온보딩 / 설정 저장.
 *
 * 클라이언트에서 이미 검증했더라도 서버에서 다시 검증한다.
 * 프로필 upsert는 멱등이라(user_id unique) 목표 저장만 실패해도 안전하게 재시도할 수 있다.
 */
export async function saveOnboarding(
  input: unknown,
): Promise<SaveProfileState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.',
    };
  }

  const values = parsed.data;
  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(onboardingValuesToProfileRow(values, user.id), {
      onConflict: 'user_id',
    });

  if (profileError) {
    return {
      error: `정보를 저장하지 못했습니다. 다시 시도해 주세요. (${profileError.message})`,
    };
  }

  const goalRow = {
    user_id: user.id,
    target_age: values.targetAge,
    target_net_worth: manToWon(values.targetNetWorthMan),
  };

  // 목표는 MVP에서 1개만 다룬다. 있으면 갱신하고 없으면 새로 만든다.
  const { data: existingGoal } = await supabase
    .from('financial_goals')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string }>();

  const { error: goalError } = existingGoal
    ? await supabase
        .from('financial_goals')
        .update(goalRow)
        .eq('id', existingGoal.id)
    : await supabase.from('financial_goals').insert(goalRow);

  if (goalError) {
    // 프로필은 이미 저장됐다. 목표만 다시 저장하면 된다.
    return {
      goalError: `기본 정보는 저장했지만 목표 저장에 실패했습니다. 목표만 다시 저장해 주세요. (${goalError.message})`,
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/compare');
  redirect('/dashboard');
}
