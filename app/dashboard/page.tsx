import Link from 'next/link';
import { IncomeTimelineChart } from '@/components/charts/IncomeTimelineChart';
import { NetWorthTimelineChart } from '@/components/charts/NetWorthTimelineChart';
import { SetupRequired } from '@/components/common/SetupRequired';
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer';
import { SummaryCardGrid } from '@/components/dashboard/SummaryCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getPrimaryGoal, requireProfile } from '@/lib/auth/dal';
import {
  ASSUMPTION_NOTES,
  ASSUMPTION_SUMMARY_LINE,
  MILESTONE_LONG_YEARS,
  MILESTONE_SHORT_YEARS,
  SIMULATION_YEARS,
} from '@/lib/constants/assumptions';
import {
  formatGoalResult,
  formatHours,
  formatKRW,
  formatPercent,
} from '@/lib/format';
import { profileToSimulationInput } from '@/lib/profile/transform';
import { runSimulation } from '@/lib/simulation';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { cn } from '@/lib/utils';

// 사용자별 데이터를 다루는 페이지다. 절대 정적으로 프리렌더되면 안 된다.
export const dynamic = 'force-dynamic';


export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const { user, profile } = await requireProfile();
  const goal = await getPrimaryGoal(user.id);

  // 계산은 전부 순수 함수가 한다. 아래는 결과를 배치하기만 한다.
  const result = runSimulation({
    label: profile.currentCompanyName ?? '현재 회사',
    input: profileToSimulationInput(profile),
    goal,
  });

  const goalText = formatGoalResult(result.goal, SIMULATION_YEARS);
  const firstYearSurplus = result.netWorth[1]?.surplus ?? 0;

  const summaryItems = [
    {
      label: '현재 연봉 (세전)',
      value: formatKRW(profile.annualSalary),
      sub: `추정 세후 ${formatKRW(result.income[1]?.net ?? 0)}`,
    },
    {
      label: '현재 순자산',
      value: formatKRW(result.netWorth[0]?.netWorth ?? 0),
      sub: `자산 ${formatKRW(profile.currentAssets)} · 부채 ${formatKRW(profile.currentDebt)}`,
      tone: (result.netWorth[0]?.netWorth ?? 0) < 0 ? ('negative' as const) : undefined,
    },
    {
      label: '현재 저축률',
      value: formatPercent(result.savingsRate),
      sub: '월 저축·투자액 ÷ 월 추정 세후소득',
    },
    {
      label: `${MILESTONE_SHORT_YEARS}년 후 예상 순자산`,
      value: formatKRW(result.netWorthAt.fiveYear),
      sub: `${profile.age + MILESTONE_SHORT_YEARS}세 시점`,
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 후 예상 순자산`,
      value: formatKRW(result.netWorthAt.tenYear),
      sub: `${profile.age + MILESTONE_LONG_YEARS}세 시점`,
    },
    {
      label: '목표 자산 달성 예상',
      value: goalText.value,
      sub: goalText.sub,
      tone:
        result.goal?.status === 'not_reached' ? ('muted' as const) : undefined,
    },
  ];

  const commuteItems = [
    {
      label: '연간 통근시간',
      value: formatHours(result.commuteHours.annual),
      sub: `${MILESTONE_LONG_YEARS}년 누적 ${formatHours(result.commuteHours.cumulative)}`,
    },
    {
      label: '연간 교통비',
      value: formatKRW(result.commuteCost.annual),
      sub: `${MILESTONE_LONG_YEARS}년 누적 ${formatKRW(result.commuteCost.cumulative)}`,
    },
    {
      label: `${MILESTONE_LONG_YEARS}년 누적 소득 (세전)`,
      value: formatKRW(result.cumulativeGrossIncome.tenYear),
      sub: `추정 세후 ${formatKRW(result.cumulativeNetIncome.tenYear)}`,
    },
  ];

  return (
    <>
      <AppHeader active="/dashboard" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              My Future Report
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {profile.currentCompanyName ?? '현재 회사'} ·{' '}
              {profile.jobRole || '직군 미입력'} · {profile.age}세 기준
            </p>
          </div>

          <Link
            href="/compare"
            className={cn(buttonVariants({ size: 'lg' }), 'h-10')}
          >
            다른 회사와 비교하기
          </Link>
        </div>

        {firstYearSurplus < 0 && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              현재 지출이 예상 세후소득을 초과합니다. 이 상태가 이어지면 자산이
              줄어드는 것으로 계산됩니다.{' '}
              <Link href="/settings" className="underline underline-offset-4">
                입력값 확인하기
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <section className="mt-8">
          <SummaryCardGrid items={summaryItems} />
          <p className="text-muted-foreground mt-3 text-xs">
            {ASSUMPTION_SUMMARY_LINE}
          </p>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-base font-semibold">예상 연봉 변화</h2>
            <p className="text-muted-foreground mt-1 mb-4 text-xs">
              {ASSUMPTION_NOTES.salaryGrowth} · {ASSUMPTION_NOTES.tax}
            </p>
            <IncomeTimelineChart data={result.income} />
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold">예상 순자산 변화</h2>
            <p className="text-muted-foreground mt-1 mb-4 text-xs">
              {ASSUMPTION_NOTES.investment} · {ASSUMPTION_NOTES.debt}
            </p>
            <NetWorthTimelineChart
              data={result.netWorth}
              goalNetWorth={goal?.targetNetWorth}
            />
          </Card>
        </section>

        <section className="mt-6">
          <SummaryCardGrid items={commuteItems} />
        </section>

        <footer className="mt-10 border-t pt-6">
          <SimulationDisclaimer />
        </footer>
      </main>
    </>
  );
}
