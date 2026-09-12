import 'server-only';

import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import {
  FINANCIAL_GOAL_COLUMNS,
  USER_PROFILE_COLUMNS,
  toFinancialGoal,
  toUserProfile,
  type FinancialGoalRow,
  type UserProfileRow,
} from '@/lib/supabase/mappers';
import type { FinancialGoal, UserProfile } from '@/types';

/**
 * Data Access Layer.
 *
 * Next.js 문서 지침대로 인증 검사를 데이터에 가장 가까운 곳에서 수행한다.
 * proxy.ts의 리다이렉트는 낙관적 1차 방어일 뿐이며, 실제 보호는 여기와 RLS가 한다.
 * `cache()`로 감싸 한 요청 안에서 중복 호출을 막는다.
 */

export const getCurrentUser = cache(async (): Promise<User | null> => {
  // 환경변수가 없으면 세션도 없다. 여기서 던지면 호출부가 전부 500이 된다.
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  // getSession()이 아니라 getUser()를 쓴다. 쿠키를 신뢰하지 않고 인증 서버에서 검증한다.
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});

/** 인증이 필요한 페이지에서 호출한다. 미인증이면 /login으로 보낸다 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export const getUserProfile = cache(
  async (userId: string): Promise<UserProfile | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select(USER_PROFILE_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle<UserProfileRow>();

    if (error || !data) return null;
    return toUserProfile(data);
  },
);

export const getPrimaryGoal = cache(
  async (userId: string): Promise<FinancialGoal | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('financial_goals')
      .select(FINANCIAL_GOAL_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<FinancialGoalRow>();

    if (error || !data) return null;
    return toFinancialGoal(data);
  },
);

/**
 * 온보딩을 마친 사용자만 통과시킨다.
 * 프로필이 없으면 /onboarding으로 보낸다.
 */
export async function requireProfile(): Promise<{
  user: User;
  profile: UserProfile;
}> {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  if (!profile) redirect('/onboarding');
  return { user, profile };
}
