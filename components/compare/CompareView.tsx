'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScenarioCompareChart } from '@/components/charts/ScenarioCompareChart';
import { SERIES } from '@/components/charts/chartTheme';
import { CompanyInfoCard } from '@/components/companies/CompanyInfoCard';
import { CompanySearch } from '@/components/companies/CompanySearch';
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ASSUMPTION_SUMMARY_LINE } from '@/lib/constants/assumptions';
import {
  profileToScenarioValues,
  profileToSimulationInput,
  scenarioValuesToOverrides,
} from '@/lib/profile/transform';
import { compareScenarios, runSimulation } from '@/lib/simulation';
import {
  toComparisonSeries,
  type ComparisonMetric,
} from '@/lib/simulation/series';
import { scenarioSchema, type ScenarioValues } from '@/lib/validation/schemas';
import type { Company, FinancialGoal, UserProfile } from '@/types';
import { ScenarioDiffSummary } from './ScenarioDiffSummary';
import { ScenarioInputForm } from './ScenarioInputForm';
import { ScenarioResultCard } from './ScenarioResultCard';

const METRICS: ReadonlyArray<{ key: ComparisonMetric; label: string }> = [
  { key: 'netWorth', label: '순자산' },
  { key: 'income', label: '연봉' },
];

export function CompareView({
  profile,
  goal,
}: {
  profile: UserProfile;
  goal: FinancialGoal | null;
}) {
  const [company, setCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [metric, setMetric] = useState<ComparisonMetric>('netWorth');

  const form = useForm<ScenarioValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: profileToScenarioValues(profile),
    mode: 'onTouched',
  });

  // 입력이 바뀔 때마다 같은 순수 함수를 다시 호출한다.
  // 서버 왕복도 DB 쓰기도 없으므로 즉시 반영된다.
  const values = form.watch();

  const currentLabel = profile.currentCompanyName ?? '현재 회사';
  const alternativeLabel = companyName.trim() || '이직 시나리오';

  const comparison = useMemo(() => {
    const current = runSimulation({
      label: `${currentLabel} 유지`,
      input: profileToSimulationInput(profile),
      goal,
    });
    const alternative = runSimulation({
      label: `${alternativeLabel}로 이직`,
      input: profileToSimulationInput(
        profile,
        scenarioValuesToOverrides(values),
      ),
      goal,
    });
    return compareScenarios(current, alternative);
  }, [profile, goal, values, currentLabel, alternativeLabel]);

  const series = useMemo(
    () => toComparisonSeries(comparison, metric),
    [comparison, metric],
  );

  const hasCompany = companyName.trim().length > 0;

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-base font-semibold">비교할 회사</h2>
        <p className="text-muted-foreground mt-1 mb-5 text-xs">
          한 번에 한 곳과 비교합니다. 회사를 고른 뒤 예상 조건을 직접 입력하세요.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <CompanySearch
              label="회사 검색"
              value={companyName}
              allowFreeText
              placeholder="예: 카카오"
              onChange={({ company: picked, name }) => {
                setCompany(picked);
                setCompanyName(name);
              }}
            />
            {company && <CompanyInfoCard company={company} />}
          </div>

          <div>
            {hasCompany ? (
              <ScenarioInputForm form={form} />
            ) : (
              <div className="text-muted-foreground flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm">
                회사를 선택하면 예상 연봉과 통근 조건을 입력할 수 있습니다.
              </div>
            )}
          </div>
        </div>
      </Card>

      {hasCompany && (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  두 시나리오의 {metric === 'netWorth' ? '순자산' : '연봉'} 변화
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {ASSUMPTION_SUMMARY_LINE}
                </p>
              </div>

              <div className="flex gap-1">
                {METRICS.map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    size="sm"
                    variant={metric === item.key ? 'secondary' : 'ghost'}
                    onClick={() => setMetric(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <ScenarioCompareChart
                data={series}
                currentLabel={comparison.current.label}
                alternativeLabel={comparison.alternative.label}
              />
            </div>
          </Card>

          <ScenarioDiffSummary comparison={comparison} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ScenarioResultCard
              result={comparison.current}
              color={SERIES.primary}
              caption="지금 조건 그대로 유지했을 때"
            />
            <ScenarioResultCard
              result={comparison.alternative}
              color={SERIES.secondary}
              caption="입력한 예상 조건으로 이직했을 때"
            />
          </div>
        </>
      )}

      <SimulationDisclaimer />
    </div>
  );
}
