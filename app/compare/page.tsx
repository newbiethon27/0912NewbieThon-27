import { SetupRequired } from '@/components/common/SetupRequired';
import { CompareView } from '@/components/compare/CompareView';
import { AppHeader } from '@/components/layout/AppHeader';
import { getPrimaryGoal, requireProfile } from '@/lib/auth/dal';
import { isSupabaseConfigured } from '@/lib/supabase/env';

// 사용자별 데이터를 다루는 페이지다. 절대 정적으로 프리렌더되면 안 된다.
export const dynamic = 'force-dynamic';


export default async function ComparePage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const { user, profile } = await requireProfile();
  const goal = await getPrimaryGoal(user.id);

  return (
    <>
      <AppHeader active="/compare" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          현재 회사 vs 다른 회사
        </h1>
        <p className="text-muted-foreground mt-1 mb-8 text-sm">
          이직했을 때 10년 뒤의 소득·순자산·통근시간이 어떻게 달라지는지
          비교합니다.
        </p>

        <CompareView profile={profile} goal={goal} />
      </main>
    </>
  );
}
