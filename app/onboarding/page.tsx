import { redirect } from 'next/navigation';
import { SetupRequired } from '@/components/common/SetupRequired';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getUserProfile, requireUser } from '@/lib/auth/dal';
import { isSupabaseConfigured } from '@/lib/supabase/env';

// 사용자별 데이터를 다루는 페이지다. 절대 정적으로 프리렌더되면 안 된다.
export const dynamic = 'force-dynamic';


export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const user = await requireUser();

  // 이미 온보딩을 마친 사용자는 대시보드로 보낸다. 수정은 /settings에서 한다.
  const profile = await getUserProfile(user.id);
  if (profile) redirect('/dashboard');

  return <OnboardingForm />;
}
