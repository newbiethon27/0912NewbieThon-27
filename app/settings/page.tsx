import { SetupRequired } from '@/components/common/SetupRequired';
import { AppHeader } from '@/components/layout/AppHeader';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { getPrimaryGoal, requireProfile } from '@/lib/auth/dal';
import { profileToFormValues } from '@/lib/profile/transform';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { wonToMan } from '@/lib/validation/schemas';

// 사용자별 데이터를 다루는 페이지다. 절대 정적으로 프리렌더되면 안 된다.
export const dynamic = 'force-dynamic';


export default async function SettingsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const { user, profile } = await requireProfile();
  const goal = await getPrimaryGoal(user.id);

  // 온보딩 폼을 그대로 재사용한다. 기존 값만 채워 넣는다.
  const defaultValues = {
    ...profileToFormValues(profile),
    targetAge: goal?.targetAge ?? profile.age + 5,
    targetNetWorthMan: goal ? wonToMan(goal.targetNetWorth) : Number.NaN,
  };

  return (
    <>
      <AppHeader active="/settings" />
      <OnboardingForm mode="settings" defaultValues={defaultValues} />
    </>
  );
}
